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
  // Payment / quote token for the presale = NVDA (NVIDIA • Robinhood RWA, 18 decimals).
  // "First RWA presale" — plays, rewards, sink, sell-back and LP all settle in NVDA.
  NVDA: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
  WETH: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  POOL_MANAGER: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  STATE_VIEW: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
};
const MINT_PRICE_NVDA = 5_000_000_000_000_000n; // 0.005 NVDA (18 decimals)
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
const WINNER_CAP_START = 100n;                 // round 1 soft tier — auto-escalates ×10 up to 1,000,000
const RAISE_DURATION_SECS = 30n * 24n * 60n * 60n; // 30-day countdown
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
  // NOTE: variable is still named USDG for legacy reasons, but it is the PAYMENT/QUOTE token =
  // NVDA on the live network. The game/staking are token-agnostic (any ERC20).
  let mintPrice;
  if (isRobinhood) {
    USDG = ROBINHOOD.NVDA;                 // pay with NVDA
    POOL_MANAGER = ROBINHOOD.POOL_MANAGER;
    STATE_VIEW = ROBINHOOD.STATE_VIEW;
    usdgDecimals = Number(await (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol:IERC20Metadata", USDG)).decimals());
    mintPrice = MINT_PRICE_NVDA;           // 0.005 NVDA
  } else {
    const mockUsdg = await (await ethers.getContractFactory("MockERC20")).deploy("NVDA", "NVDA", 18);
    await mockUsdg.waitForDeployment();
    USDG = await mockUsdg.getAddress();
    POOL_MANAGER = deployer.address;  // placeholder (not exercised in dry-run)
    STATE_VIEW = deployer.address;
    usdgDecimals = 18;
    mintPrice = MINT_PRICE_NVDA;
    console.log("  (dry-run) mock NVDA:", USDG);
  }
  console.log(`Pay token (NVDA) decimals: ${usdgDecimals} | mintPrice = 0.005 NVDA = ${mintPrice}`);

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
    mintPrice, WIN_CHANCE_BP, REVEAL_EXTRA_BLOCKS, WINNER_CAP_START, RAISE_DURATION_SECS
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

  // ── $FINGERS token (100M): mint all to deployer, then fund BOTH automated pools — the team keeps
  //    NONE. 50M → NFT-staking emission (earned by stakers over 90d, auto-starts on first stake);
  //    50M → LP migrator (auto-LP: paired with WIN-NVDA into a perma-locked pool, permissionless). ──
  const token = await (await ethers.getContractFactory("FingersToken")).deploy(deployer.address, deployer.address);
  await token.waitForDeployment();
  const EMISSION = await token.CLAIM_ALLOCATION(); // 50M — the staking-emission pool
  const LP_ALLOC = await token.LP_ALLOCATION();    // 50M — the auto-LP pool
  await (await token.transfer(await nftStaking.getAddress(), EMISSION)).wait();
  console.log("  token:      ", await token.getAddress(), "(50M -> emission pool, 50M -> auto-LP; team keeps 0)");

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
  console.log("  migrator:   ", await migrator.getAddress(), "(perma-lock; AUTO-LP wired)");
  console.log("  seeder:     ", await seeder.getAddress(), "(OPTIONAL/auto — UNwired; registrar stays deployer)");

  // ── Wire the automated tokenomics (team custodies nothing) ──
  await (await token.transfer(await migrator.getAddress(), LP_ALLOC)).wait();          // 50M FINGERS → auto-LP pool
  await (await game.setLpMigrator(await migrator.getAddress())).wait();                // wins flush here, never to team
  await (await migrator.configureAuto(
    await token.getAddress(), USDG, await game.getAddress(), V4_FEE, V4_TICK_SPACING, hookAddr
  )).wait();
  await (await nftStaking.configureEmission(await token.getAddress(), 7776000)).wait(); // 90-day emission, auto-starts on first stake
  console.log("  auto-LP:     50M FINGERS in migrator; wins→flushToLp→graduateAuto (perma-locked) after settle");
  console.log("  emission:    50M FINGERS configured (90d); AUTO-STARTS on the first NFT stake");

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
    fingersStaking: await fingersStaking.getAddress(),
    hook: hookAddr,
    migrator: await migrator.getAddress(),
    basketSeeder: await seeder.getAddress(),
    params: { mintPrice: mintPrice.toString(), winChanceBp: WIN_CHANCE_BP, revealExtraBlocks: REVEAL_EXTRA_BLOCKS, winnerCapStart: WINNER_CAP_START.toString(), raiseDurationSecs: RAISE_DURATION_SECS.toString(), v4Fee: V4_FEE, v4TickSpacing: V4_TICK_SPACING, burnBP: BURN_BP, stakerDefaultBP: STAKER_DEFAULT_BP },
    basketAssets: { ...RWA, ...MEME },
  };
  const file = path.join(__dirname, "..", `fingers-deployment.${isRobinhood ? "robinhood" : "local"}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("\n✅ Deployed. Summary saved →", file);
  console.log(JSON.stringify(out, null, 2));

  console.log("\nAUTOMATED FLOW (team custodies nothing):");
  console.log("  • Emission: AUTO-STARTS on the first NFT stake — no manual step.");
  console.log("  • Wins:     accrue as WIN-NVDA; anyone calls game.flushToLp() → migrator.");
  console.log("  POST-RAISE (all permissionless except finalize):");
  console.log("  1) game.finalize(); settle every commit until game.isSettled()");
  console.log("  2) game.flushToLp()  (WIN-NVDA → migrator)  &  game.flushToSink()  &  game.flushToStaking()");
  console.log("  3) migrator.graduateAuto()  → pairs 50M FINGERS + all WIN-NVDA into a PERMA-LOCKED pool (anyone)");
  console.log("  4) hook.registerPool(key, cfg)  → switch on the 1% buyback/burn/staker fee engine");
  console.log("  5) after 90 days: nftStaking.sweepFingersLeftover(lpWallet)  → reclaim un-staked emission.");
}

main().catch((e) => { console.error(e); process.exit(1); });
