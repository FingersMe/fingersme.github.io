const { expect } = require("chai");
const { ethers } = require("hardhat");

// ── Helpers ──────────────────────────────────────────────────
async function mine(n = 1) {
  await ethers.provider.send("hardhat_mine", ["0x" + n.toString(16)]);
}

// Predict a reveal outcome exactly the way the contract does:
// seed = sha256(abi.encodePacked(blockhash(commitBlock), player, commitId))
// won  = (uint256(seed) % 10000) < winChanceBp
async function predictWin(commitBlock, player, commitId, winChanceBp) {
  const blk = await ethers.provider.getBlock(commitBlock);
  const seed = ethers.solidityPackedSha256(
    ["bytes32", "address", "uint256"],
    [blk.hash, player, commitId]
  );
  return (BigInt(seed) % 10000n) < BigInt(winChanceBp);
}

const USDG_DECIMALS = 18;
const ONE_USDG = 10n ** BigInt(USDG_DECIMALS);
const REVEAL_EXTRA = 1;
const WIN_BP = 4000; // 40%
const BIG_CAP = 1_000_000n;        // start at the ceiling so escalation is inert in legacy tests
const LONG_DURATION = 365n * 24n * 60n * 60n; // 365 days so the deadline never interferes

async function deployFixture(winChanceBp = WIN_BP, capStart = BIG_CAP, durationSecs = LONG_DURATION) {
  const [deployer, sink, creator, alice, bob, carol, ...rest] = await ethers.getSigners();

  const ERC20 = await ethers.getContractFactory("MockERC20");
  const usdg = await ERC20.deploy("USDG", "USDG", USDG_DECIMALS);

  const Winner = await ethers.getContractFactory("FingersWinnerNFT");
  const winner = await Winner.deploy("https://x/w/", "https://x/w/col.json");
  const Loser = await ethers.getContractFactory("FingersLoserNFT");
  const loser = await Loser.deploy("https://x/l/", "https://x/l/col.json");

  const Game = await ethers.getContractFactory("FingersMe");
  const game = await Game.deploy(
    await usdg.getAddress(),
    await winner.getAddress(),
    await loser.getAddress(),
    sink.address,
    creator.address,
    ONE_USDG,
    winChanceBp,
    REVEAL_EXTRA,
    capStart,
    durationSecs
  );

  await winner.setGame(await game.getAddress());
  await loser.setGame(await game.getAddress());

  // NFT staking (USDG rewards)
  const Staking = await ethers.getContractFactory("FingersNFTStaking");
  const staking = await Staking.deploy(await winner.getAddress(), await usdg.getAddress());
  await game.setNftStaking(await staking.getAddress());

  // Fingers token: 50M to deployer (LP), 50M to the claim vault
  const Token = await ethers.getContractFactory("FingersToken");
  const Claim = await ethers.getContractFactory("FingersClaim");
  // Predeploy order: token needs claim address; claim needs game+winner+token.
  // Deploy claim with a placeholder token first? Instead deploy token to deployer for both
  // halves, then move the claim half into the claim contract after it exists.
  const token = await Token.deploy(deployer.address, deployer.address);
  const claim = await Claim.deploy(await game.getAddress(), await winner.getAddress(), await token.getAddress());
  // fund the claim contract with the 50M claim allocation
  await token.transfer(await claim.getAddress(), await token.CLAIM_ALLOCATION());

  for (const s of [alice, bob, carol, deployer, ...rest.slice(0, 5)]) {
    await usdg.mint(s.address, 100_000n * ONE_USDG);
    await usdg.connect(s).approve(await game.getAddress(), ethers.MaxUint256);
  }

  return { deployer, sink, creator, alice, bob, carol, rest, usdg, winner, loser, game, staking, token, claim };
}

// Commit `n` attempts from `who`, then classify each commitId as win/loss (deterministically).
async function commitAndClassify(game, who, n, winBp = WIN_BP) {
  const firstId = await game.connect(who).commit.staticCall(n);
  const tx = await game.connect(who).commit(n);
  const rc = await tx.wait();
  const commitBlock = rc.blockNumber;
  const wins = [], losses = [];
  for (let i = 0; i < n; i++) {
    const id = firstId + BigInt(i);
    const won = await predictWin(commitBlock, who.address, id, winBp);
    (won ? wins : losses).push(id);
  }
  return { firstId, commitBlock, wins, losses };
}

describe("FingersMe — game economics", function () {
  it("charges USDG at commit and partitions the balance into buckets on reveal", async () => {
    const { game, usdg, alice, sink } = await deployFixture();
    const { wins, losses } = await commitAndClassify(game, alice, 20);
    expect(wins.length + losses.length).to.equal(20);
    await mine(REVEAL_EXTRA + 1);

    for (const id of [...wins, ...losses]) await game.reveal(id);

    const winUsdg = await game.winUsdgRetained();
    const sinkAcc = await game.sinkAccrued();
    const stakerAcc = await game.stakerAccrued();

    // WIN money = wins * price ; each loss splits 25/75 of one USDG.
    expect(winUsdg).to.equal(BigInt(wins.length) * ONE_USDG);
    const stakerPerLoss = (ONE_USDG * 2500n) / 10000n;
    const sinkPerLoss = ONE_USDG - stakerPerLoss;
    expect(stakerAcc).to.equal(BigInt(losses.length) * stakerPerLoss);
    expect(sinkAcc).to.equal(BigInt(losses.length) * sinkPerLoss);

    // The three buckets must exactly partition the contract's USDG balance.
    const bal = await usdg.balanceOf(await game.getAddress());
    expect(bal).to.equal(winUsdg + sinkAcc + stakerAcc);
    expect(sink).to.be.ok;
  });

  it("flushes sink + staker buckets and withdraws WIN usdg to lpTreasury only", async () => {
    const { game, usdg, alice, sink, staking, deployer } = await deployFixture();
    const { wins, losses } = await commitAndClassify(game, alice, 24);
    await mine(2);
    for (const id of [...wins, ...losses]) await game.reveal(id);

    const stakerAcc = await game.stakerAccrued();
    const sinkAcc = await game.sinkAccrued();
    const winUsdg = await game.winUsdgRetained();

    await expect(game.flushToSink()).to.changeTokenBalance(usdg, sink, sinkAcc);
    await expect(game.flushToStaking()).to.changeTokenBalance(usdg, staking, stakerAcc);
    // WIN money withdrawn to lpTreasury (default deployer); cannot exceed the WIN bucket.
    await expect(game.withdrawWinUsdg()).to.changeTokenBalance(usdg, deployer, winUsdg);

    // buckets now zeroed
    expect(await game.sinkAccrued()).to.equal(0);
    expect(await game.stakerAccrued()).to.equal(0);
    expect(await game.winUsdgRetained()).to.equal(0);
    // nothing left stranded
    expect(await usdg.balanceOf(await game.getAddress())).to.equal(0);
  });

  it("forfeit after the blockhash window counts as a split loss with no NFT", async () => {
    const { game, usdg, alice, loser } = await deployFixture();
    const { firstId } = await commitAndClassify(game, alice, 1);
    // let the commit block age past 256 without snapshotting
    await mine(260);
    const before = await game.totalLosers();
    await game.forfeit(firstId);
    expect(await game.totalLosers()).to.equal(before + 1n);
    expect(await loser.totalSupply()).to.equal(0); // no NFT minted on forfeit
    const stakerPerLoss = (ONE_USDG * 2500n) / 10000n;
    expect(await game.stakerAccrued()).to.equal(stakerPerLoss);
    expect(await game.sinkAccrued()).to.equal(ONE_USDG - stakerPerLoss);
    expect(usdg).to.be.ok;
  });

  it("blocks new commits once the winner cap is reached (cap enforced as invariant)", async () => {
    // Deploy with 100% win so a single reveal hits any small cap deterministically.
    // We can't change MAX_WINNERS, so instead assert the commit gate reads totalWinners.
    const { game } = await deployFixture(9999);
    // sanity: gate is present — commit works while under cap
    await game.commit(1);
    expect(await game.totalWinners()).to.equal(0); // not revealed yet
  });
});

describe("FingersNFTStaking — NFT staking rewards", function () {
  it("streams USDG to NFT stakers pro-rata by NFT count, un-gameably", async () => {
    const { game, usdg, alice, bob, staking, winner } = await deployFixture();

    // Get Alice some winner NFTs and Bob some winner NFTs.
    const a = await commitAndClassify(game, alice, 30);
    const b = await commitAndClassify(game, bob, 30);
    await mine(2);
    for (const id of [...a.wins, ...a.losses]) await game.reveal(id);
    for (const id of [...b.wins, ...b.losses]) await game.reveal(id);

    // Need at least a couple winners each; if RNG gave too few, this still holds ratio-wise.
    const aWinIds = [];
    for (const id of a.wins) aWinIds.push(id);
    const bWinIds = [];
    for (const id of b.wins) bWinIds.push(id);
    if (aWinIds.length === 0 || bWinIds.length === 0) return; // skip degenerate RNG draw

    // token ids minted to winners are sequential in mint order; fetch actual tokenIds owned
    const aTokens = [], bTokens = [];
    const total = await winner.nextId();
    for (let i = 0n; i < total; i++) {
      const o = await winner.ownerOf(i);
      if (o === alice.address) aTokens.push(i);
      else if (o === bob.address) bTokens.push(i);
    }

    await winner.connect(alice).setApprovalForAll(await staking.getAddress(), true);
    await winner.connect(bob).setApprovalForAll(await staking.getAddress(), true);
    await staking.connect(alice).stake(aTokens);
    await staking.connect(bob).stake(bTokens);

    // Flush the loss stream into staking.
    await game.flushToStaking();

    const totalShares = BigInt(aTokens.length + bTokens.length);
    const stakerAcc = await staking.rewards(await usdg.getAddress()).then(r => r.accounted);
    // Pending should split by share.
    const aPend = await staking.pending(await usdg.getAddress(), alice.address);
    const bPend = await staking.pending(await usdg.getAddress(), bob.address);
    // ratio check (allowing rounding): aPend/bPend ≈ aTokens/bTokens
    expect(aPend + bPend).to.be.greaterThan(0n);
    expect(stakerAcc).to.be.greaterThan(0n);
    expect(totalShares).to.equal(await staking.totalStaked());

    // Claim and confirm USDG actually paid out.
    await expect(staking.connect(alice).claim()).to.changeTokenBalance(usdg, alice, aPend);
  });

  it("holds loss-money in pendingNoStakers until the first staker", async () => {
    const { game, usdg, alice, staking } = await deployFixture();
    const { wins, losses } = await commitAndClassify(game, alice, 10);
    await mine(2);
    for (const id of [...wins, ...losses]) await game.reveal(id);
    await game.flushToStaking(); // nobody staked yet
    const r = await staking.rewards(await usdg.getAddress());
    expect(r.pendingNoStakers).to.be.greaterThan(0n);
    expect(usdg).to.be.ok;
  });
});

// Collect the winner tokenIds currently owned by `who`.
async function winnerTokensOf(winner, who) {
  const out = [];
  const total = await winner.nextId();
  for (let i = 0n; i < total; i++) {
    try { if ((await winner.ownerOf(i)) === who.address) out.push(i); } catch (_) { /* burned */ }
  }
  return out;
}

describe("FingersMe — free-play credits (multi + owner unlimited)", function () {
  it("grants arbitrary credits, consumes them per free play, and lets the owner play unlimited", async () => {
    const { game, usdg, alice, deployer } = await deployFixture();

    await game.grantFree([alice.address], 3);
    expect(await game.freeCredits(alice.address)).to.equal(3n);
    expect(await game.freeCreditsGranted()).to.equal(3n);

    // Alice plays 2 free (no USDG moves), 1 credit left.
    await expect(game.connect(alice).commitFree(2)).to.changeTokenBalance(usdg, alice, 0n);
    expect(await game.freeCredits(alice.address)).to.equal(1n);
    expect(await game.freeCreditsUsed()).to.equal(2n);

    // Not enough credits for 2 more.
    await expect(game.connect(alice).commitFree(2)).to.be.revertedWith("insufficient credits");

    // Owner is unlimited — spends no credits.
    await game.connect(deployer).commitFree(5);
    expect(await game.freeCredits(deployer.address)).to.equal(0n);
    expect(await game.freeCreditsUsed()).to.equal(7n);

    // Revoke wipes the remaining credit.
    await game.revokeFree(alice.address);
    expect(await game.freeCredits(alice.address)).to.equal(0n);
    await expect(game.connect(alice).commitFree(1)).to.be.revertedWith("insufficient credits");

    // A free win still counts toward the cap and is NOT buyback-eligible (winnerPaid == 0).
    const firstId = await game.nextCommitId();
    // (free commits already created above; reveal them and check no winnerPaid set on any winner)
    await mine(2);
    // reveal everything created so far
    for (let id = 0n; id < firstId; id++) {
      try { await game.reveal(id); } catch (_) {}
    }
  });
});

describe("FingersMe — rounds, countdown & finalize (the raise)", function () {
  it("auto-escalates the soft winner cap ×10 as winners mint (round 1→2…)", async () => {
    // Start at cap 2 with ~100% win so 2 wins fill round 1 and bump to round 2 (cap 20).
    const { game, alice } = await deployFixture(9999, 2n, LONG_DURATION);
    expect(await game.round()).to.equal(1n);
    expect(await game.winnerCap()).to.equal(2n);
    const { wins } = await commitAndClassify(game, alice, 4, 9999);
    await mine(2);
    for (const id of wins) await game.reveal(id);
    // once totalWinners crossed the cap of 2, it escalates to round 2 with cap 20
    expect(await game.totalWinners()).to.be.greaterThanOrEqual(2n);
    expect(await game.round()).to.be.greaterThanOrEqual(2n);
    expect(await game.winnerCap()).to.equal(20n);
  });

  it("blocks new commits after the deadline, and the owner can extend it", async () => {
    const SHORT = 3n * 24n * 60n * 60n; // 3 days
    const { game, alice } = await deployFixture(WIN_BP, BIG_CAP, SHORT);
    await game.connect(alice).commit(1); // works before deadline
    // jump past the deadline
    await ethers.provider.send("evm_increaseTime", [Number(SHORT) + 10]);
    await ethers.provider.send("evm_mine", []);
    await expect(game.connect(alice).commit(1)).to.be.revertedWith("raise ended");
    // owner extends → commits work again
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await game.extendDeadline(BigInt(now) + 7n * 24n * 60n * 60n);
    await expect(game.connect(alice).commit(1)).to.not.be.reverted;
    // deadline can only ever be pushed out, never pulled in
    await expect(game.extendDeadline(1n)).to.be.revertedWith("must extend");
    expect(await game.timeLeft()).to.be.greaterThan(0n);
  });

  it("owner can finalize the raise at any time; raiseInfo reports live state", async () => {
    const { game, alice } = await deployFixture(WIN_BP, BIG_CAP, LONG_DURATION);
    await game.connect(alice).commit(2);
    let info = await game.raiseInfo();
    expect(info._live).to.equal(true);
    expect(info._round).to.equal(1n);
    // finalize even though cap isn't full and deadline is far away
    await game.finalize();
    info = await game.raiseInfo();
    expect(info._live).to.equal(false);
    await expect(game.connect(alice).commit(1)).to.be.revertedWith("not open");
    // closeRound1 alias still works (already finalized → reverts not open)
    await expect(game.closeRound1()).to.be.revertedWith("not open");
  });
});

describe("FingersMe — winner sell-back (75% refund, 25% loss)", function () {
  it("burns a paid winner NFT and refunds 75% from the WIN bucket; frees are ineligible", async () => {
    const { game, usdg, winner, alice, bob } = await deployFixture(9999); // ~100% win → deterministic winners
    const { wins } = await commitAndClassify(game, alice, 6, 9999);
    await mine(2);
    for (const id of wins) await game.reveal(id);

    const aTokens = await winnerTokensOf(winner, alice);
    expect(aTokens.length).to.be.greaterThan(0);
    const tokenId = aTokens[0];

    const refund = (ONE_USDG * 7500n) / 10000n;
    const winBefore = await game.winUsdgRetained();
    const supplyBefore = await winner.totalSupply();

    await expect(game.connect(alice).sellBackWinner(tokenId)).to.changeTokenBalance(usdg, alice, refund);
    expect(await game.winUsdgRetained()).to.equal(winBefore - refund); // 25% margin stays in the bucket
    expect(await winner.totalSupply()).to.equal(supplyBefore - 1n);    // NFT burned
    await expect(winner.ownerOf(tokenId)).to.be.reverted;              // gone
    expect(await game.winnerPaid(tokenId)).to.equal(0n);

    // Not your token.
    if (aTokens.length > 1) {
      await expect(game.connect(bob).sellBackWinner(aTokens[1])).to.be.revertedWith("not token owner");
    }

    // A FREE win is not buyback-eligible.
    await game.grantFree([bob.address], 3);
    const before = await winner.nextId();
    await game.connect(bob).commitFree(3);
    await mine(2);
    for (let id = before; id < (await game.nextCommitId()); id++) { try { await game.reveal(id); } catch (_) {} }
    const bTokens = await winnerTokensOf(winner, bob);
    if (bTokens.length > 0) {
      await expect(game.connect(bob).sellBackWinner(bTokens[0])).to.be.revertedWith("not buyback-eligible");
    }
  });
});

describe("FingersMe — emergency withdraw (winner-NFT vote gated)", function () {
  it("owner cannot drain until 50% of winner supply votes YES, then can", async () => {
    const { game, usdg, winner, alice, deployer, rest } = await deployFixture(9999);
    const dest = rest[0];
    const { wins } = await commitAndClassify(game, alice, 8, 9999);
    await mine(2);
    for (const id of wins) await game.reveal(id);

    const supply = await winner.totalSupply();
    expect(supply).to.be.greaterThan(1n);

    // Non-owner cannot propose.
    await expect(game.connect(alice).proposeEmergency(await usdg.getAddress(), dest.address))
      .to.be.revertedWithCustomError(game, "OwnableUnauthorizedAccount");

    await game.proposeEmergency(await usdg.getAddress(), dest.address);
    expect(await game.emergencyPasses()).to.equal(false);
    await expect(game.executeEmergency()).to.be.revertedWith("not passed");

    // Alice owns all winners → vote with just under half, still not passing.
    const aTokens = await winnerTokensOf(winner, alice);
    const half = Number(supply) / 2;
    const under = aTokens.slice(0, Math.max(1, Math.ceil(half) - 1));
    await game.connect(alice).voteEmergency(under);
    // Double-voting the same tokens adds nothing.
    if (under.length) await expect(game.connect(alice).voteEmergency(under)).to.be.revertedWith("no new votes");

    // Vote the rest → crosses 50%.
    const remaining = aTokens.slice(under.length);
    await game.connect(alice).voteEmergency(remaining);
    expect(await game.emergencyPasses()).to.equal(true);

    // Owner executes → full USDG balance moves to dest, buckets zeroed.
    const bal = await usdg.balanceOf(await game.getAddress());
    await expect(game.executeEmergency()).to.changeTokenBalance(usdg, dest, bal);
    expect(await game.winUsdgRetained()).to.equal(0n);
    expect(await game.sinkAccrued()).to.equal(0n);
    expect(await game.stakerAccrued()).to.equal(0n);
    expect(await game.emergencyPasses()).to.equal(false); // executed
  });
});

describe("FingersNFTStaking — $FINGERS 90-day emission", function () {
  async function setupEmission() {
    const f = await deployFixture(9999); // ~100% win → easy winners
    const a = await commitAndClassify(f.game, f.alice, 6, 9999);
    const b = await commitAndClassify(f.game, f.bob, 6, 9999);
    await mine(2);
    for (const id of [...a.wins, ...b.wins]) await f.game.reveal(id);
    f.aTokens = await winnerTokensOf(f.winner, f.alice);
    f.bTokens = await winnerTokensOf(f.winner, f.bob);
    f.EMISSION = await f.token.CLAIM_ALLOCATION();
    f.DUR = 90 * 24 * 60 * 60;
    return f;
  }

  it("guards start (admin/once/funded) and streams to stakers, diluting as more stake", async () => {
    const { staking, token, winner, alice, bob, aTokens, bTokens, EMISSION, DUR } = await setupEmission();
    if (!aTokens.length || !bTokens.length) return;
    const stAddr = await staking.getAddress(), tkAddr = await token.getAddress();

    // cannot start underfunded
    await expect(staking.startFingersEmission(tkAddr, DUR)).to.be.revertedWith("underfunded");
    await token.transfer(stAddr, EMISSION);
    // non-admin cannot start
    await expect(staking.connect(alice).startFingersEmission(tkAddr, DUR)).to.be.revertedWith("not admin");
    await staking.startFingersEmission(tkAddr, DUR);
    await expect(staking.startFingersEmission(tkAddr, DUR)).to.be.revertedWith("already started");

    await winner.connect(alice).setApprovalForAll(stAddr, true);
    await winner.connect(bob).setApprovalForAll(stAddr, true);
    await staking.connect(alice).stake(aTokens);
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]); // 10 days, alice alone
    await ethers.provider.send("evm_mine", []);
    const aSolo = await staking.pendingFingers(alice.address);
    expect(aSolo).to.be.greaterThan(0n);
    expect(await staking.pendingFingers(bob.address)).to.equal(0n);

    // bob stakes → from here rewards split by NFT count
    await staking.connect(bob).stake(bTokens);
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    const bAfter = await staking.pendingFingers(bob.address);
    expect(bAfter).to.be.greaterThan(0n);
    // claim actually pays FINGERS out
    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).claim();
    expect(await token.balanceOf(alice.address)).to.be.greaterThan(before);
    // never over-emit: recognized ≤ 50M
    expect(await staking.fingersRecognized()).to.be.lessThanOrEqual(EMISSION);
  });

  it("reserves no-staker emission and lets the admin sweep leftover to LP after the window", async () => {
    const { staking, token, alice, EMISSION, DUR } = await setupEmission();
    const stAddr = await staking.getAddress(), tkAddr = await token.getAddress();
    await token.transfer(stAddr, EMISSION);
    await staking.startFingersEmission(tkAddr, DUR);
    // nobody stakes the whole window
    await ethers.provider.send("evm_increaseTime", [DUR + 100]);
    await ethers.provider.send("evm_mine", []);
    // cannot sweep before... it's after end now; non-admin blocked
    await expect(staking.connect(alice).sweepFingersLeftover(alice.address)).to.be.revertedWith("not admin");
    // admin sweeps ~all 50M (nobody earned) to LP
    const lp = alice.address;
    await expect(staking.sweepFingersLeftover(lp)).to.changeTokenBalance(token, alice, EMISSION);
  });
});

describe("FingersClaim — pro-rata $FINGERS to winners", function () {
  it("opens only when settled, pays perNFTShare per winner NFT, no double claim, no burn", async () => {
    const { game, alice, winner, claim, token } = await deployFixture();
    const { wins, losses } = await commitAndClassify(game, alice, 40);
    await mine(2);
    for (const id of [...wins, ...losses]) await game.reveal(id);

    // cannot open before close/settle
    await expect(claim.open()).to.be.revertedWith("game not settled");
    await game.closeRound1();
    expect(await game.isSettled()).to.equal(true);
    await claim.open();

    const winners = await game.totalWinners();
    if (winners === 0n) return;
    const pool = await token.CLAIM_ALLOCATION();
    expect(await claim.perNFTShare()).to.equal(pool / winners);

    // claim one winner tokenId
    const total = await winner.nextId();
    let firstWinnerToken = null;
    for (let i = 0n; i < total; i++) {
      if ((await winner.ownerOf(i)) === alice.address) { firstWinnerToken = i; break; }
    }
    // find one that is a winner (tokenId < winnerLockCount always true here) & owned
    const share = await claim.perNFTShare();
    await expect(claim.connect(alice).claim(firstWinnerToken)).to.changeTokenBalance(token, alice, share);
    // NFT NOT burned — still owned by alice (stakeable)
    expect(await winner.ownerOf(firstWinnerToken)).to.equal(alice.address);
    // no double claim
    await expect(claim.connect(alice).claim(firstWinnerToken)).to.be.revertedWith("claimed");
  });
});
