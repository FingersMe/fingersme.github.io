const { expect } = require("chai");
const { ethers } = require("hardhat");
const { reset } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * FingersHook against REAL Uniswap v4 on a Robinhood fork:
 *   - mine + deploy the hook at a 0x44 CREATE2 address;
 *   - create a hooked FINGERS/asset v4 pool + locked liquidity via FingersLPMigrator;
 *   - register the pool; do a REAL buy + sell via PoolSwapTest;
 *   - assert the 1% fee is skimmed each way, processFees burns the FINGERS share, and the
 *     reflexive buyback-and-burn spends the accrued quote to buy + burn FINGERS.
 *
 *   npx hardhat test test/FingersHook.fork.test.js
 */
const RH_RPC = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
const STATE_VIEW = "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b";
const FEE = 10000, TS = 200;
const E = (n) => ethers.parseEther(String(n));
const HOOK_FLAGS = 0x44n, FLAG_MASK = 0x3fffn;

describe("FingersHook — real Uniswap v4 (Robinhood fork)", function () {
  this.timeout(300000);

  before(async function () {
    try { await reset(RH_RPC); } catch (e) { this.skip(); }
    if ((await ethers.provider.getCode(POOL_MANAGER)) === "0x") this.skip();
  });
  after(async () => { await reset(); });

  it("skims 1% on a real buy + sell, burns the FINGERS fee, and reflexively buys back + burns", async () => {
    const [deployer, trader] = await ethers.getSigners();

    const M = await ethers.getContractFactory("MockBurnableERC20");
    const fingers = await M.deploy("Fingers", "FINGERS", 18);
    const asset = await M.deploy("BasketAsset", "ASSET", 18);
    for (const t of [fingers, asset]) { await t.mint(deployer.address, E(2_000_000)); await t.mint(trader.address, E(1_000_000)); }

    // 1) mine + deploy the hook.
    const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
    const c2Addr = await c2.getAddress();
    const HookF = await ethers.getContractFactory("FingersHook");
    const initCode = ethers.concat([HookF.bytecode, HookF.interface.encodeDeploy([POOL_MANAGER, deployer.address, STATE_VIEW, deployer.address])]);
    const hash = ethers.keccak256(initCode);
    let salt, hookAddr;
    for (let i = 0; i < 500000; i++) {
      const s = ethers.zeroPadValue(ethers.toBeHex(i), 32);
      const a = ethers.getCreate2Address(c2Addr, s, hash);
      if ((BigInt(a) & FLAG_MASK) === HOOK_FLAGS) { salt = s; hookAddr = a; break; }
    }
    await (await c2.deploy(salt, initCode)).wait();
    const hook = await ethers.getContractAt("FingersHook", hookAddr);

    // 2) create the hooked FINGERS/asset pool + locked liquidity.
    const migrator = await (await ethers.getContractFactory("FingersLPMigrator")).deploy(POOL_MANAGER);
    await fingers.transfer(await migrator.getAddress(), E(500_000));
    await asset.transfer(await migrator.getAddress(), E(500_000));
    await migrator.graduate({
      token: await fingers.getAddress(), quote: await asset.getAddress(),
      fee: FEE, tickSpacing: TS, amountToken: E(500_000), amountQuote: E(500_000), hooks: hookAddr,
    });

    // 3) register the pool (deployer is registrar).
    const fAddr = (await fingers.getAddress()).toLowerCase();
    const aAddr = (await asset.getAddress()).toLowerCase();
    const [c0, c1] = fAddr < aAddr ? [await fingers.getAddress(), await asset.getAddress()] : [await asset.getAddress(), await fingers.getAddress()];
    const key = { currency0: c0, currency1: c1, fee: FEE, tickSpacing: TS, hooks: hookAddr };
    const pid = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address,address,uint24,int24,address)"], [[c0, c1, FEE, TS, hookAddr]]));
    await hook.registerPool(key, {
      set: false, launchToken: await fingers.getAddress(), quote: await asset.getAddress(),
      treasury: deployer.address, creator: deployer.address,
      buyFeeBP: 100, sellFeeBP: 100, burnBP: 5000, fee: FEE, tickSpacing: TS,
    });

    // 4) real swaps.
    const swapRouter = await (await ethers.getContractFactory("PoolSwapTest")).deploy(POOL_MANAGER);
    await asset.connect(trader).approve(await swapRouter.getAddress(), ethers.MaxUint256);
    await fingers.connect(trader).approve(await swapRouter.getAddress(), ethers.MaxUint256);
    const settings = { takeClaims: false, settleUsingBurn: false };
    const MIN = 4295128740n, MAX = 1461446703485210103287273052203988822378723970342n - 1n;
    const fingersIs0 = c0.toLowerCase() === fAddr;

    // BUY FINGERS: swap ASSET -> FINGERS. zeroForOne = asset is currency0 = !fingersIs0
    await swapRouter.connect(trader).swap(
      key, { zeroForOne: !fingersIs0, amountSpecified: -E(1000), sqrtPriceLimitX96: !fingersIs0 ? MIN + 1n : MAX }, settings, "0x");
    const skimBuy = await hook.accruedOf(pid, await fingers.getAddress());
    expect(skimBuy, "buy skims FINGERS").to.be.greaterThan(0n);

    // SELL FINGERS: swap FINGERS -> ASSET. zeroForOne = fingers is currency0 = fingersIs0
    await swapRouter.connect(trader).swap(
      key, { zeroForOne: fingersIs0, amountSpecified: -E(1000), sqrtPriceLimitX96: fingersIs0 ? MIN + 1n : MAX }, settings, "0x");
    const skimSell = await hook.accruedOf(pid, await asset.getAddress());
    expect(skimSell, "sell skims ASSET").to.be.greaterThan(0n);

    // ~1% of a 1000 input, minus pool fee — sanity bound (0.5%..1.5%)
    expect(skimSell).to.be.greaterThan(E(4)).and.to.be.lessThan(E(15));

    // 5) route the FINGERS fee → burn share.
    const supplyBefore = await fingers.totalSupply();
    await hook.processFees(pid, await fingers.getAddress());
    expect(await fingers.totalSupply(), "burnBP share burned").to.be.lessThan(supplyBefore);

    // 6) reflexive buyback-and-burn: accrued ASSET buys FINGERS from the pool + burns it.
    const raiseAccrued = await hook.accruedOf(pid, await asset.getAddress());
    expect(raiseAccrued).to.be.greaterThan(0n);
    const supplyBB = await fingers.totalSupply();
    await (await hook.buybackAndBurn(pid, 0)).wait();
    expect(await hook.accruedOf(pid, await asset.getAddress())).to.equal(0n);
    expect(await fingers.totalSupply(), "bought FINGERS burned").to.be.lessThan(supplyBB);
    expect(await hook.buybackVolume(pid)).to.equal(raiseAccrued);
  });
});
