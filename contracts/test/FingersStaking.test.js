const { expect } = require("chai");
const { ethers } = require("hardhat");

const E = (n) => ethers.parseUnits(n.toString(), 18);

async function fixture() {
  const [deployer, alice, bob, hook] = await ethers.getSigners();
  const ERC20 = await ethers.getContractFactory("MockERC20");
  const fingers = await ERC20.deploy("Fingers", "FINGERS", 18);
  const NFTView = await ethers.getContractFactory("MockNFTStakeView");
  const nftView = await NFTView.deploy();
  const Staking = await ethers.getContractFactory("FingersStaking");
  const staking = await Staking.deploy(await fingers.getAddress(), await nftView.getAddress());

  for (const s of [alice, bob]) {
    await fingers.mint(s.address, E(1_000_000));
    await fingers.connect(s).approve(await staking.getAddress(), ethers.MaxUint256);
  }
  // hook holds fingers to stream as rewards
  await fingers.mint(hook.address, E(1_000_000));

  return { deployer, alice, bob, hook, fingers, nftView, staking };
}

// stream `amount` FINGERS rewards into staking (simulates the hook transfer + notify)
async function stream(fingers, staking, hook, amount) {
  await fingers.connect(hook).transfer(await staking.getAddress(), amount);
  await staking.connect(hook).notifyReward(await fingers.getAddress(), 0);
}

describe("FingersStaking — boosted rewards", function () {
  it("splits rewards by staked amount when nobody has an NFT boost", async () => {
    const { alice, bob, hook, fingers, staking } = await fixture();
    await staking.connect(alice).stake(E(100));
    await staking.connect(bob).stake(E(300)); // 1:3
    await stream(fingers, staking, hook, E(400));

    const aP = await staking.pending(alice.address);
    const bP = await staking.pending(bob.address);
    expect(aP).to.equal(E(100));
    expect(bP).to.equal(E(300));
  });

  it("boosts a staker's share by their staked-NFT count", async () => {
    const { alice, bob, hook, fingers, nftView, staking } = await fixture();
    // Alice stakes 100 with 10 NFTs (+10% => weight 110); Bob stakes 100 with 0 NFTs (weight 100).
    await nftView.setCount(alice.address, 10);
    await staking.connect(alice).stake(E(100));
    await staking.connect(bob).stake(E(100));
    await stream(fingers, staking, hook, E(210));

    const aP = await staking.pending(alice.address);
    const bP = await staking.pending(bob.address);
    // 110:100 split of 210 => 110 and 100
    expect(aP).to.equal(E(110));
    expect(bP).to.equal(E(100));
  });

  it("caps the boost and lets a user refresh it with syncBoost()", async () => {
    const { alice, nftView, staking } = await fixture();
    await nftView.setCount(alice.address, 100000); // way over cap
    await staking.connect(alice).stake(E(100));
    // maxBoostBP default 20000 (+200%) => effWeight = 100 * 3 = 300
    const u = await staking.userInfo(alice.address);
    expect(u.effWeight).to.equal(E(300));

    // lower the count, then sync
    await nftView.setCount(alice.address, 0);
    await staking.connect(alice).syncBoost();
    const u2 = await staking.userInfo(alice.address);
    expect(u2.effWeight).to.equal(E(100));
  });

  it("holds rewards in pendingNoStakers until the first staker", async () => {
    const { hook, fingers, staking } = await fixture();
    await stream(fingers, staking, hook, E(50));
    expect(await staking.pendingNoStakers()).to.equal(E(50));
    expect(await staking.accRewardPerShare()).to.equal(0);
  });

  it("early-exit forfeit redistributes to remaining stakers", async () => {
    const { alice, bob, hook, fingers, staking } = await fixture();
    await staking.connect(alice).stake(E(100));
    await staking.connect(bob).stake(E(100));
    await stream(fingers, staking, hook, E(200)); // 100 each pending

    // Alice unstakes immediately (before minHold) -> forfeits earlyExitBP (50%) of her 100 pending
    const aliceBalBefore = await fingers.balanceOf(alice.address);
    await staking.connect(alice).unstake(E(100));
    const aliceBalAfter = await fingers.balanceOf(alice.address);
    // Alice gets principal 100 + 50 reward (forfeited 50)
    expect(aliceBalAfter - aliceBalBefore).to.equal(E(150));
    // Bob's pending grows by the forfeited 50 -> 150
    expect(await staking.pending(bob.address)).to.equal(E(150));
  });
});
