const { expect } = require("chai");
const { ethers } = require("hardhat");

// v4 hook permission flags encoded in the low 14 bits of the hook address.
// afterSwap = 1<<6 (0x40), afterSwapReturnDelta = 1<<2 (0x04)  =>  0x44
const HOOK_FLAGS = 0x44n;
const FLAG_MASK = 0x3fffn;

// Mine a CREATE2 salt so the FingersHook lands at an address with the right flag bits,
// then deploy it there — exactly how it is deployed on Robinhood.
async function mineAndDeployHook(c2Addr, HookF, ctorArgs) {
  const initCode = ethers.concat([HookF.bytecode, HookF.interface.encodeDeploy(ctorArgs)]);
  const hash = ethers.keccak256(initCode);
  for (let i = 0; i < 2_000_000; i++) {
    const salt = ethers.zeroPadValue(ethers.toBeHex(i), 32);
    const addr = ethers.getCreate2Address(c2Addr, salt, hash);
    if ((BigInt(addr) & FLAG_MASK) === HOOK_FLAGS) return { salt, addr, initCode };
  }
  throw new Error("hook mining failed");
}

describe("FingersHook — deploy at mined address + config guards", function () {
  it("mines a valid 0x44 hook address, deploys there, and reports correct permissions", async () => {
    const [deployer, registrar, stateView, pm] = await ethers.getSigners();
    const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
    const HookF = await ethers.getContractFactory("FingersHook");
    const args = [pm.address, registrar.address, stateView.address, deployer.address];

    const { salt, addr, initCode } = await mineAndDeployHook(await c2.getAddress(), HookF, args);
    expect((BigInt(addr) & FLAG_MASK)).to.equal(HOOK_FLAGS);
    await (await c2.deploy(salt, initCode)).wait();

    const hook = await ethers.getContractAt("FingersHook", addr);
    const perms = await hook.getHookPermissions();
    expect(perms.afterSwap).to.equal(true);
    expect(perms.afterSwapReturnDelta).to.equal(true);
    expect(perms.beforeSwap).to.equal(false);
    expect(await hook.owner()).to.equal(deployer.address);
    expect(await hook.registrar()).to.equal(registrar.address);
  });

  it("gates registerPool to the registrar and enforces the ≤1% knob cap", async () => {
    const [deployer, registrar, stateView, pm, notRegistrar, fingers, treasury, creator] = await ethers.getSigners();
    const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
    const HookF = await ethers.getContractFactory("FingersHook");
    const args = [pm.address, registrar.address, stateView.address, deployer.address];
    const { salt, addr, initCode } = await mineAndDeployHook(await c2.getAddress(), HookF, args);
    await (await c2.deploy(salt, initCode)).wait();
    const hook = await ethers.getContractAt("FingersHook", addr);

    const key = {
      currency0: fingers.address < treasury.address ? fingers.address : treasury.address,
      currency1: fingers.address < treasury.address ? treasury.address : fingers.address,
      fee: 10000, tickSpacing: 200, hooks: addr,
    };
    const cfgOK = {
      set: false, launchToken: fingers.address, quote: treasury.address, treasury: treasury.address,
      creator: creator.address, buyFeeBP: 100, sellFeeBP: 100, burnBP: 5000, fee: 10000, tickSpacing: 200,
    };
    // non-registrar cannot register
    await expect(hook.connect(notRegistrar).registerPool(key, cfgOK)).to.be.revertedWith("registrar");
    // knob over 1% (101 bp) rejected
    const cfgBad = { ...cfgOK, buyFeeBP: 101 };
    await expect(hook.connect(registrar).registerPool(key, cfgBad)).to.be.revertedWith("knob>1%");
    // valid registration succeeds
    await expect(hook.connect(registrar).registerPool(key, cfgOK)).to.emit(hook, "PoolRegistered");
  });

  it("only the owner can tune automation defaults; bounds enforced", async () => {
    const [deployer, registrar, stateView, pm, staking, rando] = await ethers.getSigners();
    const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
    const HookF = await ethers.getContractFactory("FingersHook");
    const args = [pm.address, registrar.address, stateView.address, deployer.address];
    const { salt, addr, initCode } = await mineAndDeployHook(await c2.getAddress(), HookF, args);
    await (await c2.deploy(salt, initCode)).wait();
    const hook = await ethers.getContractAt("FingersHook", addr);

    await expect(hook.connect(rando).setStakingDefaults(staking.address, 3000)).to.be.revertedWith("owner");
    await hook.connect(deployer).setStakingDefaults(staking.address, 3000);
    expect(await hook.defaultStaking()).to.equal(staking.address);
    expect(await hook.defaultStakerBP()).to.equal(3000);
    await expect(hook.connect(deployer).setStakingDefaults(staking.address, 10001)).to.be.revertedWith("bp");
  });

  it("creator can only DECREASE knobs, never raise them", async () => {
    const [deployer, registrar, stateView, pm, fingers, quote, treasury, creator] = await ethers.getSigners();
    const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
    const HookF = await ethers.getContractFactory("FingersHook");
    const args = [pm.address, registrar.address, stateView.address, deployer.address];
    const { salt, addr, initCode } = await mineAndDeployHook(await c2.getAddress(), HookF, args);
    await (await c2.deploy(salt, initCode)).wait();
    const hook = await ethers.getContractAt("FingersHook", addr);

    const key = {
      currency0: fingers.address < quote.address ? fingers.address : quote.address,
      currency1: fingers.address < quote.address ? quote.address : fingers.address,
      fee: 10000, tickSpacing: 200, hooks: addr,
    };
    const cfg = {
      set: false, launchToken: fingers.address, quote: quote.address, treasury: treasury.address,
      creator: creator.address, buyFeeBP: 100, sellFeeBP: 100, burnBP: 5000, fee: 10000, tickSpacing: 200,
    };
    await hook.connect(registrar).registerPool(key, cfg);
    const pid = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address,address,uint24,int24,address)"],
      [[key.currency0, key.currency1, 10000, 200, addr]]));

    // raise attempt reverts
    await expect(hook.connect(creator).decreaseKnobs(pid, 101, 100, 5000)).to.be.revertedWith("increase");
    // non-creator reverts
    await expect(hook.connect(deployer).decreaseKnobs(pid, 50, 50, 4000)).to.be.revertedWith("auth");
    // decrease succeeds
    await hook.connect(creator).decreaseKnobs(pid, 50, 60, 4000);
    const c = await hook.poolConfig(pid);
    expect(c.buyFeeBP).to.equal(50);
    expect(c.sellFeeBP).to.equal(60);
    expect(c.burnBP).to.equal(4000);
  });
});
