const { expect } = require("chai");
const { ethers } = require("hardhat");
const { reset } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * FingersBasketSeeder against REAL Uniswap v4 on a Robinhood fork: the full automatic path.
 * For each basket asset it swaps USDG->asset through a DISCOVERED live pool, creates a
 * FINGERS/asset pool with the hook attached, seeds + LOCKS it, and registers it with the hook.
 *
 *   npx hardhat test test/FingersBasketSeeder.fork.test.js
 */
const RH_RPC = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
const STATE_VIEW = "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b";
const FEE = 10000, TS = 200;
const E = (n) => ethers.parseEther(String(n));
const HOOK_FLAGS = 0x44n, FLAG_MASK = 0x3fffn;

function pidOf(a, b, fee, ts, hooks) {
  const [c0, c1] = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
  return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address,address,uint24,int24,address)"], [[c0, c1, fee, ts, hooks]]));
}

describe("FingersBasketSeeder — full auto seed (Robinhood fork)", function () {
  this.timeout(300000);
  before(async function () {
    try { await reset(RH_RPC); } catch (e) { this.skip(); }
    if ((await ethers.provider.getCode(POOL_MANAGER)) === "0x") this.skip();
  });
  after(async () => { await reset(); });

  it("swaps USDG->asset on live v4, creates + locks + registers a FINGERS/asset pool per leg", async () => {
    const [deployer, treasury, creator] = await ethers.getSigners();
    const M = await ethers.getContractFactory("MockBurnableERC20");
    const usdg = await M.deploy("USDG", "USDG", 18);
    const a1 = await M.deploy("Asset1", "AS1", 18);
    const a2 = await M.deploy("Asset2", "AS2", 18);
    const fingers = await M.deploy("Fingers", "FINGERS", 18);
    for (const t of [usdg, a1, a2, fingers]) await t.mint(deployer.address, E(3_000_000));

    // Seed real USDG/asset pools (hookless) so the seeder's on-chain discovery finds a route.
    const migrator = await (await ethers.getContractFactory("FingersLPMigrator")).deploy(POOL_MANAGER);
    for (const a of [a1, a2]) {
      await usdg.transfer(await migrator.getAddress(), E(500_000));
      await a.transfer(await migrator.getAddress(), E(500_000));
      await migrator.graduate({
        token: await a.getAddress(), quote: await usdg.getAddress(),
        fee: FEE, tickSpacing: TS, amountToken: E(500_000), amountQuote: E(500_000), hooks: ethers.ZeroAddress,
      });
    }

    // Mine + deploy the hook; registrar will be the seeder.
    const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
    const HookF = await ethers.getContractFactory("FingersHook");
    const initCode = ethers.concat([HookF.bytecode, HookF.interface.encodeDeploy([POOL_MANAGER, deployer.address, STATE_VIEW, deployer.address])]);
    const hash = ethers.keccak256(initCode);
    let salt, hookAddr;
    for (let i = 0; i < 500000; i++) {
      const s = ethers.zeroPadValue(ethers.toBeHex(i), 32);
      const addr = ethers.getCreate2Address(await c2.getAddress(), s, hash);
      if ((BigInt(addr) & FLAG_MASK) === HOOK_FLAGS) { salt = s; hookAddr = addr; break; }
    }
    await (await c2.deploy(salt, initCode)).wait();
    const hook = await ethers.getContractAt("FingersHook", hookAddr);

    const seeder = await (await ethers.getContractFactory("FingersBasketSeeder")).deploy(POOL_MANAGER, deployer.address);
    await hook.setRegistrar(await seeder.getAddress()); // seeder may register pools

    // Fund the seeder and run the automatic basket graduation.
    const gradRaise = E(2000), lpTokens = E(200000);
    await usdg.transfer(await seeder.getAddress(), gradRaise);
    await fingers.transfer(await seeder.getAddress(), lpTokens);

    await (await seeder.seedBasket({
      token: await fingers.getAddress(), usdg: await usdg.getAddress(),
      gradRaise, lpTokens,
      assets: [await a1.getAddress(), await a2.getAddress()], weights: [5000, 5000],
      hook: hookAddr, treasury: treasury.address, creator: creator.address,
      buyFeeBP: 100, sellFeeBP: 100, burnBP: 5000,
    })).wait();

    const sv = new ethers.Contract(STATE_VIEW, ["function getLiquidity(bytes32) view returns (uint128)"], ethers.provider);
    for (const a of [a1, a2]) {
      const pid = pidOf(await fingers.getAddress(), await a.getAddress(), FEE, TS, hookAddr);
      // pool registered with the hook (fee engine live)
      const cfg = await hook.poolConfig(pid);
      expect(cfg.set, "pool registered").to.equal(true);
      expect(cfg.launchToken).to.equal(await fingers.getAddress());
      expect(cfg.quote).to.equal(await a.getAddress());
      // pool holds locked liquidity
      expect(await sv.getLiquidity(pid), "pool seeded").to.be.greaterThan(0n);
    }
    // The seeder exposes NO withdraw path — the position is permanently locked.
    expect(seeder.withdraw).to.equal(undefined);
  });
});
