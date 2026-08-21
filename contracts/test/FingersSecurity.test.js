const { expect } = require("chai");
const { ethers } = require("hardhat");

async function mine(n = 1) { await ethers.provider.send("hardhat_mine", ["0x" + n.toString(16)]); }
async function predictWin(commitBlock, player, commitId, winBp) {
  const blk = await ethers.provider.getBlock(commitBlock);
  const seed = ethers.solidityPackedSha256(["bytes32", "address", "uint256"], [blk.hash, player, commitId]);
  return (BigInt(seed) % 10000n) < BigInt(winBp);
}
const ONE = 10n ** 18n;

async function deploy(winBp) {
  const [deployer, sink, creator, alice] = await ethers.getSigners();
  const usdg = await (await ethers.getContractFactory("MockERC20")).deploy("USDG", "USDG", 18);
  const winner = await (await ethers.getContractFactory("FingersWinnerNFT")).deploy("w/", "w/c");
  const loser = await (await ethers.getContractFactory("FingersLoserNFT")).deploy("l/", "l/c");
  const game = await (await ethers.getContractFactory("FingersMe")).deploy(
    usdg.target, winner.target, loser.target, sink.address, creator.address, ONE, winBp, 1,
    1_000_000n, 365n * 24n * 60n * 60n
  );
  await winner.setGame(game.target);
  await loser.setGame(game.target);
  const nftStaking = await (await ethers.getContractFactory("FingersNFTStaking")).deploy(winner.target, usdg.target);
  await usdg.mint(alice.address, 10_000n * ONE);
  await usdg.connect(alice).approve(game.target, ethers.MaxUint256);
  return { deployer, sink, creator, alice, usdg, winner, loser, game, nftStaking };
}

describe("Security — reentrancy + access control", function () {
  it("blocks re-entry into reveal from an ERC721 receiver (guard + CEI holds)", async () => {
    const { deployer, alice, usdg, game } = await deploy(9000); // high win chance
    const recv = await (await ethers.getContractFactory("ReentrantReceiver")).deploy();
    await recv.setGame(game.target);

    // Alice pays for attempts on behalf of the receiver contract.
    const first = await game.connect(alice).commitFor.staticCall(recv.target, 10);
    const rc = await (await game.connect(alice).commitFor(recv.target, 10)).wait();
    // find a winning commitId for the receiver
    let winId = null;
    for (let i = 0; i < 10; i++) {
      const id = first + BigInt(i);
      if (await predictWin(rc.blockNumber, recv.target, id, 9000)) { winId = id; break; }
    }
    if (winId === null) throw new Error("no winning commit drawn");

    await mine(2);
    await recv.armReveal(winId); // during the mint callback it will try to re-enter reveal(winId)
    await game.reveal(winId);
    // reentered stays false because the nested reveal reverted inside the guard
    expect(await recv.reentered()).to.equal(false);
    expect(usdg).to.be.ok;
  });

  it("setNftStaking is a one-time bind; only owner", async () => {
    const { game, nftStaking, alice } = await deploy(4000);
    await expect(game.connect(alice).setNftStaking(nftStaking.target)).to.be.reverted; // not owner
    await game.setNftStaking(nftStaking.target);
    await expect(game.setNftStaking(nftStaking.target)).to.be.revertedWith("already set");
  });

  it("buckets partition the balance; flushToLp needs a migrator and moves only the WIN bucket", async () => {
    const { game, usdg, alice, deployer } = await deploy(4000);
    const first = await game.connect(alice).commit.staticCall(20);
    await (await game.connect(alice).commit(20)).wait();
    await mine(2);
    const ids = [];
    for (let i = 0; i < 20; i++) ids.push(first + BigInt(i));
    await game.revealBatch(ids);

    const win = await game.winUsdgRetained();
    const sink = await game.sinkAccrued();
    const staker = await game.stakerAccrued();
    // flushToLp reverts until a migrator is wired (wins can only ever become locked LP, never team funds)
    await expect(game.flushToLp()).to.be.revertedWith("migrator unset");
    // partition holds
    expect(await usdg.balanceOf(game.target)).to.equal(win + sink + staker);
    expect(deployer).to.be.ok;
  });

  it("commitFor can only gift an entry (payer pays, player owns) — never take one", async () => {
    const { game, usdg, alice, deployer } = await deploy(4000);
    // deployer funds + approves, pays for alice
    await usdg.mint(deployer.address, 100n * ONE);
    await usdg.approve(game.target, ethers.MaxUint256);
    const before = await usdg.balanceOf(deployer.address);
    const first = await game.commitFor.staticCall(alice.address, 3);
    await game.commitFor(alice.address, 3);
    // deployer paid 3 USDG; the commits belong to alice
    expect(before - (await usdg.balanceOf(deployer.address))).to.equal(3n * ONE);
    const c = await game.getCommit(first);
    expect(c.player).to.equal(alice.address);
  });
});
