const { expect } = require("chai");
const { ethers } = require("hardhat");
const { reset } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * FingersLPMigrator against REAL Uniswap v4 on a Robinhood fork:
 *  - GRIEF-PROOF: an attacker pre-initializes the exact pool at a bad price; graduation must
 *    still succeed (adopt the existing price) instead of bricking — reference audit HIGH-1.
 *  - LOCKED LP: the position is owned by the immutable migrator with no withdraw path.
 *
 *   npx hardhat test test/FingersMigrator.fork.test.js
 */
const RH_RPC = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
const STATE_VIEW = "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b";
const FEE = 10000, TS = 200;
const E = (n) => ethers.parseEther(String(n));
const ONE_SQRT = 79228162514264337593543950336n; // sqrtPriceX96 for a 1:1 price

function pidOf(a, b, fee, ts, hooks) {
  const [c0, c1] = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
  return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address,address,uint24,int24,address)"], [[c0, c1, fee, ts, hooks]]));
}

describe("FingersLPMigrator — grief-proof + locked LP (Robinhood fork)", function () {
  this.timeout(300000);
  before(async function () {
    try { await reset(RH_RPC); } catch (e) { this.skip(); }
    if ((await ethers.provider.getCode(POOL_MANAGER)) === "0x") this.skip();
  });
  after(async () => { await reset(); });

  it("graduates even when the pool was pre-initialized at a bad price, and locks the LP", async () => {
    const [deployer, attacker] = await ethers.getSigners();
    const M = await ethers.getContractFactory("MockBurnableERC20");
    const fingers = await M.deploy("Fingers", "FINGERS", 18);
    const quote = await M.deploy("Quote", "Q", 18);
    await fingers.mint(deployer.address, E(1_000_000));
    await quote.mint(deployer.address, E(1_000_000));

    const migrator = await (await ethers.getContractFactory("FingersLPMigrator")).deploy(POOL_MANAGER);

    const fAddr = await fingers.getAddress(), qAddr = await quote.getAddress();
    const [c0, c1] = fAddr.toLowerCase() < qAddr.toLowerCase() ? [fAddr, qAddr] : [qAddr, fAddr];
    const key = { currency0: c0, currency1: c1, fee: FEE, tickSpacing: TS, hooks: ethers.ZeroAddress };

    // ATTACKER pre-initializes the exact pool at a skewed price (gas-only grief).
    const pm = new ethers.Contract(POOL_MANAGER,
      ["function initialize((address,address,uint24,int24,address) key, uint160 sqrtPriceX96) returns (int24)"],
      attacker);
    const griefPrice = ONE_SQRT * 3n; // ~9x off a fair 1:1
    await (await pm.initialize([c0, c1, FEE, TS, ethers.ZeroAddress], griefPrice)).wait();

    // GRADUATION must still succeed (adopt the existing price), not revert.
    await fingers.transfer(await migrator.getAddress(), E(500_000));
    await quote.transfer(await migrator.getAddress(), E(500_000));
    await (await migrator.graduate({
      token: fAddr, quote: qAddr, fee: FEE, tickSpacing: TS,
      amountToken: E(500_000), amountQuote: E(500_000), hooks: ethers.ZeroAddress,
    })).wait();

    const sv = new ethers.Contract(STATE_VIEW,
      ["function getLiquidity(bytes32) view returns (uint128)", "function getSlot0(bytes32) view returns (uint160,int24,uint24,uint24)"],
      ethers.provider);
    const pid = pidOf(fAddr, qAddr, FEE, TS, ethers.ZeroAddress);
    expect(await sv.getLiquidity(pid), "liquidity added despite grief").to.be.greaterThan(0n);
    const [sqrtP] = await sv.getSlot0(pid);
    expect(sqrtP, "adopted the pre-init price").to.equal(griefPrice);

    // No withdraw path exists on the migrator → LP is permanently locked.
    expect(migrator.withdraw).to.equal(undefined);
    expect(migrator.collect).to.equal(undefined);
  });
});
