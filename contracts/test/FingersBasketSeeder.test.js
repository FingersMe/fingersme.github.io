const { expect } = require("chai");
const { ethers } = require("hardhat");

// Config + pre-flight validation of the basket seeder (the swap/seed path needs a live v4
// PoolManager and is covered by the fork test that runs on the deploy machine).
describe("FingersBasketSeeder — config + validation", function () {
  async function fx() {
    const [deployer, manager, pm, rando, token, usdg, hook, asset] = await ethers.getSigners();
    const Seeder = await ethers.getContractFactory("FingersBasketSeeder");
    const seeder = await Seeder.deploy(pm.address, manager.address);
    return { deployer, manager, pm, rando, token, usdg, hook, asset, seeder };
  }

  it("seeds the standard v4 tier + via catalog on construction", async () => {
    const { seeder } = await fx();
    expect(await seeder.tierCatalogLength()).to.equal(4n);
    expect(await seeder.viaAnchorsLength()).to.equal(1n);
    expect(await seeder.lpFee()).to.equal(10000n);
    expect(await seeder.lpTickSpacing()).to.equal(200n);
    expect(await seeder.autoDiscover()).to.equal(true);
  });

  it("gates route/config setters to owner-or-manager", async () => {
    const { seeder, manager, rando, usdg, asset } = await fx();
    await expect(
      seeder.connect(rando).setRoute(usdg.address, asset.address, 10000, 200, ethers.ZeroAddress)
    ).to.be.revertedWith("auth");
    // manager can set a route
    await expect(seeder.connect(manager).setRoute(usdg.address, asset.address, 10000, 200, ethers.ZeroAddress))
      .to.emit(seeder, "RouteSet");
    const key = await seeder.routeKey(usdg.address, asset.address);
    const r = await seeder.routes(key);
    expect(r.set).to.equal(true);
    expect(r.fee).to.equal(10000n);
  });

  it("rejects a malformed basket before any pool interaction", async () => {
    const { seeder, token, usdg, hook, asset } = await fx();
    const base = {
      token: token.address, usdg: usdg.address, gradRaise: 1000, lpTokens: 1000,
      hook: hook.address, treasury: hook.address, creator: hook.address,
      buyFeeBP: 100, sellFeeBP: 100, burnBP: 5000,
    };
    // weights don't sum to BP
    await expect(seeder.seedBasket({ ...base, assets: [asset.address], weights: [9999] }))
      .to.be.revertedWith("weights");
    // asset == usdg is illegal (no FINGERS/USDG pool by design)
    await expect(seeder.seedBasket({ ...base, assets: [usdg.address], weights: [10000] }))
      .to.be.revertedWith("asset");
    // hook required
    await expect(seeder.seedBasket({ ...base, hook: ethers.ZeroAddress, assets: [asset.address], weights: [10000] }))
      .to.be.revertedWith("hook");
    // length mismatch
    await expect(seeder.seedBasket({ ...base, assets: [asset.address], weights: [5000, 5000] }))
      .to.be.revertedWith("basket");
  });
});
