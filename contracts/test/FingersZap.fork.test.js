const { expect } = require("chai");
const { ethers } = require("hardhat");
const { reset } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * FingersZap against REAL Uniswap v4 on a Robinhood fork: a player enters the game paying
 * with an ARBITRARY asset. The zap swaps asset->USDG through a real v4 pool and commits the
 * whole-USDG-worth of attempts FOR the player, refunding the remainder.
 *
 *   npx hardhat test test/FingersZap.fork.test.js
 */
const RH_RPC = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
const FEE = 10000, TS = 200;
const E = (n) => ethers.parseEther(String(n));

describe("FingersZap — pay with any asset (Robinhood fork)", function () {
  this.timeout(300000);

  before(async function () {
    try { await reset(RH_RPC); } catch (e) { this.skip(); }
    if ((await ethers.provider.getCode(POOL_MANAGER)) === "0x") this.skip();
  });
  after(async () => { await reset(); });

  it("swaps asset->USDG on live v4 and commits attempts for the player", async () => {
    const [deployer, sink, creator, player] = await ethers.getSigners();

    const M = await ethers.getContractFactory("MockERC20");
    const usdg = await M.deploy("USDG", "USDG", 18);   // 18-dec here for simple math
    const asset = await M.deploy("PayAsset", "PAY", 18);
    await usdg.mint(deployer.address, E(1_000_000));
    await asset.mint(deployer.address, E(1_000_000));
    await asset.mint(player.address, E(10_000));

    // Create a real ASSET/USDG v4 pool (hookless) seeded 1:1 so ~1 asset ≈ 1 USDG.
    const migrator = await (await ethers.getContractFactory("FingersLPMigrator")).deploy(POOL_MANAGER);
    await usdg.transfer(await migrator.getAddress(), E(500_000));
    await asset.transfer(await migrator.getAddress(), E(500_000));
    await migrator.graduate({
      token: await asset.getAddress(), quote: await usdg.getAddress(),
      fee: FEE, tickSpacing: TS, amountToken: E(500_000), amountQuote: E(500_000), hooks: ethers.ZeroAddress,
    });

    // Game priced at 1 USDG/attempt.
    const winner = await (await ethers.getContractFactory("FingersWinnerNFT")).deploy("w/", "w/c");
    const loser = await (await ethers.getContractFactory("FingersLoserNFT")).deploy("l/", "l/c");
    const game = await (await ethers.getContractFactory("FingersMe")).deploy(
      await usdg.getAddress(), await winner.getAddress(), await loser.getAddress(),
      sink.address, creator.address, E(1), 4000, 0,
      1_000_000n, 365n * 24n * 60n * 60n);
    await winner.setGame(await game.getAddress());
    await loser.setGame(await game.getAddress());

    const zap = await (await ethers.getContractFactory("FingersZap")).deploy(POOL_MANAGER, await game.getAddress());
    await asset.connect(player).approve(await zap.getAddress(), ethers.MaxUint256);

    const route = { tokenIn: await asset.getAddress(), fee: FEE, tickSpacing: TS, hooks: ethers.ZeroAddress };
    const before = await game.nextCommitId();
    const playerAssetBefore = await asset.balanceOf(player.address);

    // Pay 100 asset (~100 USDG worth) → expect ~50-100 attempts (1% pool fee + slippage).
    const [attempts, usdgOut, refund] = await zap.connect(player).zapCommit.staticCall(route, E(100), 0);
    await (await zap.connect(player).zapCommit(route, E(100), 0)).wait();

    expect(attempts, "at least some attempts bought").to.be.greaterThan(0n);
    expect(await game.nextCommitId()).to.equal(before + attempts); // commits created
    // the commits belong to the PLAYER
    const c = await game.getCommit(before);
    expect(c.player).to.equal(player.address);
    // player spent exactly 100 asset
    expect(playerAssetBefore - (await asset.balanceOf(player.address))).to.equal(E(100));
    // refund is the USDG remainder (usdgOut - attempts*price)
    expect(usdgOut - refund).to.equal(attempts * E(1));
  });
});
