const { expect } = require("chai");
const { ethers } = require("hardhat");

async function mine(n = 1) { await ethers.provider.send("hardhat_mine", ["0x" + n.toString(16)]); }
async function predictWin(commitBlock, player, commitId, winBp) {
  const blk = await ethers.provider.getBlock(commitBlock);
  const seed = ethers.solidityPackedSha256(["bytes32", "address", "uint256"], [blk.hash, player, commitId]);
  return (BigInt(seed) % 10000n) < BigInt(winBp);
}
const ONE = 10n ** 18n;

async function deploy(winBp = 4000) {
  const [deployer, sink, creator, alice] = await ethers.getSigners();
  const usdg = await (await ethers.getContractFactory("MockERC20")).deploy("USDG", "USDG", 18);
  const winner = await (await ethers.getContractFactory("FingersWinnerNFT")).deploy("w/", "w/c");
  const loser = await (await ethers.getContractFactory("FingersLoserNFT")).deploy("l/", "l/c");
  const game = await (await ethers.getContractFactory("FingersMe")).deploy(
    usdg.target, winner.target, loser.target, sink.address, creator.address, ONE, winBp, 1,
    1_000_000n, 365n * 24n * 60n * 60n);
  await winner.setGame(game.target);
  await loser.setGame(game.target);
  const nftStaking = await (await ethers.getContractFactory("FingersNFTStaking")).deploy(winner.target, usdg.target);
  await game.setNftStaking(nftStaking.target);
  const token = await (await ethers.getContractFactory("FingersToken")).deploy(deployer.address, deployer.address);
  const claim = await (await ethers.getContractFactory("FingersClaim")).deploy(game.target, winner.target, token.target);
  await token.transfer(claim.target, await token.CLAIM_ALLOCATION());
  await usdg.mint(alice.address, 10_000n * ONE);
  await usdg.connect(alice).approve(game.target, ethers.MaxUint256);
  return { deployer, sink, creator, alice, usdg, winner, loser, game, nftStaking, token, claim };
}

async function commitClassify(game, who, n, winBp = 4000) {
  const first = await game.connect(who).commit.staticCall(n);
  const rc = await (await game.connect(who).commit(n)).wait();
  const wins = [], losses = [];
  for (let i = 0; i < n; i++) {
    const id = first + BigInt(i);
    (await predictWin(rc.blockNumber, who.address, id, winBp) ? wins : losses).push(id);
  }
  return { first, block: rc.blockNumber, wins, losses };
}

describe("Edge cases — coverage parity", function () {
  it("snapshotBlockHash lets a commit be revealed after its block ages past 256", async () => {
    const { game, alice } = await deploy();
    const { first } = await commitClassify(game, alice, 1);
    const commitBlock = (await game.getCommit(first)).commitBlock;
    // snapshot while still in-window, then age past the window and reveal from the snapshot
    await game.snapshotBlockHash(commitBlock);
    await mine(300);
    await expect(game.reveal(first)).to.emit(game, "Revealed");
    expect((await game.getCommit(first)).settled).to.equal(true);
  });

  it("NFT staking: unstake returns the NFT and pays accrued USDG", async () => {
    const { game, usdg, alice, winner, nftStaking } = await deploy(9000);
    const { wins, losses } = await commitClassify(game, alice, 20, 9000);
    await mine(2);
    for (let i = 0; i < 20; i += 100) await game.revealBatch([...wins, ...losses]);
    // collect alice's winner tokenIds
    const toks = [];
    const total = await winner.nextId();
    for (let i = 0n; i < total; i++) if ((await winner.ownerOf(i)) === alice.address) toks.push(i);
    expect(toks.length).to.be.greaterThan(0);

    await winner.connect(alice).setApprovalForAll(nftStaking.target, true);
    await nftStaking.connect(alice).stake(toks);
    expect(await winner.ownerOf(toks[0])).to.equal(nftStaking.target); // held by staking
    await game.flushToStaking();

    const pend = await nftStaking.pending(usdg.target, alice.address);
    expect(pend).to.be.greaterThan(0n);
    await expect(nftStaking.connect(alice).unstake(toks)).to.changeTokenBalance(usdg, alice, pend);
    expect(await winner.ownerOf(toks[0])).to.equal(alice.address); // returned
  });

  it("claimMany pays perNFTShare per winner token in one call", async () => {
    const { game, alice, winner, claim, token } = await deploy(9000);
    const { wins, losses } = await commitClassify(game, alice, 20, 9000);
    await mine(2);
    await game.revealBatch([...wins, ...losses]);
    await game.closeRound1();
    await claim.open();
    const toks = [];
    const total = await winner.nextId();
    for (let i = 0n; i < total; i++) if ((await winner.ownerOf(i)) === alice.address) toks.push(i);
    const share = await claim.perNFTShare();
    await expect(claim.connect(alice).claimMany(toks)).to.changeTokenBalance(token, alice, share * BigInt(toks.length));
    expect(await claim.totalClaimed()).to.equal(BigInt(toks.length));
  });
});
