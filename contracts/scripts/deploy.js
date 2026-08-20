/* eslint-disable no-console */
// Fingers Me — full system deployment (manual-LP model).
//
//   Local dry-run (deploys mock USDG, validates all wiring):
//     npx hardhat run scripts/deploy.js
//   Robinhood mainnet:
//     npx hardhat run scripts/deploy.js --network robinhood
//
// The team seeds liquidity MANUALLY: after Round 1, withdraw the retained WIN USDG
// (game.withdrawWinUsdg -> lpTreasury) plus the 50M $FINGERS LP allocation, and create the
// locked FINGERS/asset pools by hand (optionally via FingersLPMigrator for perma-lock, then
// hook.registerPool to switch on the 1% fee engine). The BasketSeeder is deployed but left
// UNwired (registrar stays the deployer) so manual registration works; wire it later only if
// you switch to auto-basket graduation.

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

// ── Robinhood Chain constants (chainId 4663) ──
const ROBINHOOD = {
  USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  WETH: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  POOL_MANAGER: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  STATE_VIEW: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
};
// Loss sink: 75% of every losing bet (immutable in the game).
const USDG_SINK = "0x91b5965e81DAC2687D0dAD000bd6ef207D2D167f";

// Basket assets (for reference / manual LP + optional later seeding).
const RWA = {
  NVDA: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
  AAPL: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
  SPY:  "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C",
  GME:  "0x1b0E319c6A659F002271B69dB8A7df2F911c153E",
};
const MEME = {
  CASHCAT:  "0x020bfC650A365f8BB26819deAAbF3E21291018b4",
  PACK:     "0x0145AcbcceFbEd6F303C420bEeaaAc72E905430b",
  THROBBIN: "0xe8fB470E0685437d7739BD2AacBA60b228800335",
  HMM:      "0x7FE995a80075dF3Dc8Ae11A9b82c7FE4202CD87f",
};

const V4_FEE = 10000;        // 1% pool tier
const V4_TICK_SPACING = 200;
const WIN_CHANCE_BP = 4000;  // 40% win
const REVEAL_EXTRA_BLOCKS = 0; // Robinhood opcode clock: next block suffices
const STAKER_DEFAULT_BP = 3000; // 30% of the post-burn FINGERS skim → stakers
const BURN_BP = 5000;        // 50% of a FINGERS skim burned (buy/sell fee routing)

// Hook flags: afterSwap(0x40) | afterSwapReturnDelta(0x04) = 0x44
const HOOK_FLAGS = 0x44n, FLAG_MASK = 0x3fffn;

async function mineAndDeployHook(poolManager, registrar, stateView, owner) {
  const c2 = await (await ethers.getContractFactory("Create2Deployer")).deploy();
  await c2.waitForDeployment();
  const HookF = await ethers.getContractFactory("FingersHook");
  const initCode = ethers.concat([HookF.bytecode, HookF.interface.encodeDeploy([poolManager, registrar, stateView, owner])]);
  const hash = ethers.keccak256(initCode);
  for (let i = 0; i < 3_000_000; i++) {
    const salt = ethers.zeroPadValue(ethers.toBeHex(i), 32);
    const addr = ethers.getCreate2Address(await c2.getAddress(), salt, hash);
    if ((BigInt(addr) & FLAG_MASK) === HOOK_FLAGS) {
      await (await c2.deploy(salt, initCode)).wait();
      return addr;
    }
  }
  throw new Error("hook mining failed");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const isRobinhood = Number(net.chainId) === 4663;
  console.log(`\nNetwork chainId: ${net.chainId} ${isRobinhood ? "(Robinhood mainnet)" : "(local dry-run)"}`);
  console.log(`Deployer:        ${deployer.address}`);

  // Resolve chain-specific addresses (mock them locally so the wiring can be validated).
  let USDG, POOL_MANAGER, STATE_VIEW, usdgDecimals;
  if (isRobinhood) {
    USDG = ROBINHOOD.USDG;
    POOL_MANAGER = ROBINHOOD.POOL_MANAGER;
    STATE_VIEW = ROBINHOOD.STATE_VIEW;
    usdgDecimals = Number(await (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol:IERC20Metadata", USDG)).decimals());
  } else {
    const mockUsdg = await (await ethers.getContractFactory("MockERC20")).deploy("USDG", "USDG", 6);
    await mockUsdg.waitForDeployment();
    USDG = await mockUsdg.getAddress();
    POOL_MANAGER = deployer.address;  // placeholder (not exercised in dry-run)
    STATE_VIEW = deployer.address;
    usdgDecimals = 6;
    console.log("  (dry-run) mock USDG:", USDG);
  }
  const mintPrice = 10n ** BigInt(usdgDecimals); // 1 USDG
  console.log(`USDG decimals:   ${usdgDecimals} | mintPrice = 1 USDG = ${mintPrice}`);

  // ── NFTs ──
  const winner = await (await ethers.getContractFactory("FingersWinnerNFT")).deploy("ipfs://fingers/winner/", "ipfs://fingers/winner/collection.json");
  await winner.waitForDeployment();
  const loser = await (await ethers.getContractFactory("FingersLoserNFT")).deploy("ipfs://fingers/loser/", "ipfs://fingers/loser/collection.json");
  await loser.waitForDeployment();
  console.log("  winnerNFT:  ", await winner.getAddress());
  console.log("  loserNFT:   ", await loser.getAddress());

  // ── Game ──
  const game = await (await ethers.getContractFactory("FingersMe")).deploy(
    USDG, await winner.getAddress(), await loser.getAddress(), USDG_SINK, deployer.address,
    mintPrice, WIN_CHANCE_BP, REVEAL_EXTRA_BLOCKS
  );
  await game.waitForDeployment();
  await (await winner.setGame(await game.getAddress())).wait();
  await (await loser.setGame(await game.getAddress())).wait();
  console.log("  game:       ", await game.getAddress());

  // ── NFT staking (USDG loss stream) ──
  const nftStaking = await (await ethers.getContractFactory("FingersNFTStaking")).deploy(await winner.getAddress(), USDG);
  await nftStaking.waitForDeployment();
  await (await game.setNftStaking(await nftStaking.getAddress())).wait();
  console.log("  nftStaking: ", await nftStaking.getAddress());

  // ── $FINGERS token (100M): mint all to deployer, then fund the claim vault with 50M ──
  const token = await (await ethers.getContractFactory("FingersToken")).deploy(deployer.address, deployer.address);
  await token.waitForDeployment();
  const claim = await (await ethers.getContractFactory("FingersClaim")).deploy(await game.getAddress(), await winner.getAddress(), await token.getAddress());
  await claim.waitForDeployment();
  await (await token.transfer(await claim.getAddress(), await token.CLAIM_ALLOCATION())).wait();
  console.log("  token:      ", await token.getAddress(), "(50M LP kept by deployer, 50M -> claim)");
  console.log("  claim:      ", await claim.getAddress());

  // ── $FINGERS staking (boosted by staked NFTs) ──
  const fingersStaking = await (await ethers.getContractFactory("FingersStaking")).deploy(await token.getAddress(), await nftStaking.getAddress());
  await fingersStaking.waitForDeployment();
  console.log("  fStaking:   ", await fingersStaking.getAddress());

  // ── Hook (mined 0x44 address); registrar = deployer so MANUAL pools can be registered ──
  const hookAddr = await mineAndDeployHook(POOL_MANAGER, deployer.address, STATE_VIEW, deployer.address);
  const hook = await ethers.getContractAt("FingersHook", hookAddr);
  await (await hook.setStakingDefaults(await fingersStaking.getAddress(), STAKER_DEFAULT_BP)).wait();
  await (await hook.setAutoProcess(true)).wait();
  console.log("  hook:       ", hookAddr, `(staker-default ${STAKER_DEFAULT_BP/100}% + auto-process ON)`);

  // ── LP migrator (optional perma-lock for manual seeding) + basket seeder (optional/auto) ──
  const migrator = await (await ethers.getContractFactory("FingersLPMigrator")).deploy(POOL_MANAGER);
  await migrator.waitForDeployment();
  const seeder = await (await ethers.getContractFactory("FingersBasketSeeder")).deploy(POOL_MANAGER, deployer.address);
  await seeder.waitForDeployment();
  console.log("  migrator:   ", await migrator.getAddress(), "(perma-lock; use for manual locked LP)");
  console.log("  seeder:     ", await seeder.getAddress(), "(OPTIONAL/auto — UNwired; registrar stays deployer)");

  const out = {
    chainId: Number(net.chainId),
    dryRun: !isRobinhood,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    usdg: USDG, usdgSink: USDG_SINK, poolManager: POOL_MANAGER, stateView: STATE_VIEW,
    winnerNFT: await winner.getAddress(),
    loserNFT: await loser.getAddress(),
    game: await game.getAddress(),
    nftStaking: await nftStaking.getAddress(),
    token: await token.getAddress(),
    claim: await claim.getAddress(),
    fingersStaking: await fingersStaking.getAddress(),
    hook: hookAddr,
    migrator: await migrator.getAddress(),
    basketSeeder: await seeder.getAddress(),
    params: { mintPrice: mintPrice.toString(), winChanceBp: WIN_CHANCE_BP, revealExtraBlocks: REVEAL_EXTRA_BLOCKS, v4Fee: V4_FEE, v4TickSpacing: V4_TICK_SPACING, burnBP: BURN_BP, stakerDefaultBP: STAKER_DEFAULT_BP },
    basketAssets: { ...RWA, ...MEME },
  };
  const file = path.join(__dirname, "..", `fingers-deployment.${isRobinhood ? "robinhood" : "local"}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("\n✅ Deployed. Summary saved →", file);
  console.log(JSON.stringify(out, null, 2));

  console.log("\nMANUAL LP CHECKLIST (post Round 1):");
  console.log("  1) game.closeRound1(); settle every commit (reveal/forfeit) until game.isSettled()");
  console.log("  2) claim.open()  → winners claim 50M $FINGERS pro-rata (NFTs stay stakeable)");
  console.log("  3) game.flushToSink()  (75% losses → sink)  &  game.flushToStaking()  (25% → NFT stakers)");
  console.log("  4) game.withdrawWinUsdg()  → pull the retained WIN USDG to your LP wallet");
  console.log("  5) build FINGERS/asset locked pools by hand (via migrator.graduate with hooks=hook),");
  console.log("     then hook.registerPool(key, cfg) on each to switch on the 1% fee engine.");
}

main().catch((e) => { console.error(e); process.exit(1); });
