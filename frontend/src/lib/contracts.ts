import type { Address } from "viem";
import {
  FingersMeABI, FingersTokenABI, FingersWinnerNFTABI, FingersLoserNFTABI,
  FingersNFTStakingABI, FingersClaimABI, FingersStakingABI, FingersZapABI,
} from "../abi";

// ── Deployed addresses ──────────────────────────────────────────────────────
// Fill these from contracts/fingers-deployment.robinhood.json after deploying. Until then
// they are the zero address and the UI shows a "not deployed yet" state gracefully.
// You can also override any of them via a VITE_ADDR_* env var without rebuilding the map.
const Z = "0x0000000000000000000000000000000000000000" as Address;
const env = (k: string, fallback: Address): Address => {
  const v = import.meta.env[k] as string | undefined;
  // Treat missing OR empty ("VITE_ADDR_X=") as not-set so the fallback wins and the UI
  // shows a clean pre-launch state instead of querying a bogus empty address.
  return v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : fallback;
};

// Live Robinhood mainnet (chainId 4663) v3 deployment — 2026-08-21. All addresses are PUBLIC and
// safe to ship; they are baked as defaults so the static (GitHub Pages) build is wired without an
// .env. A VITE_ADDR_* env var still overrides any of them for local/preview against another deploy.
export const addresses = {
  usdg:          env("VITE_ADDR_USDG",          "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"),
  game:          env("VITE_ADDR_GAME",          "0x13e011D2432beF48D137d8F908180e2caA70E0Bf"),
  token:         env("VITE_ADDR_TOKEN",         "0xDE8Ba322DbB3bB9CD015bD9E6F55B87cBb3710fE"),
  winnerNFT:     env("VITE_ADDR_WINNER",        "0x61995eF4d05847C0D435D04e5B573099B7a22B88"),
  loserNFT:      env("VITE_ADDR_LOSER",         "0x7824F544b78CfDA141636c6B4397264b94e3F66C"),
  nftStaking:    env("VITE_ADDR_NFTSTAKING",    "0xb3d580df0Da4B65BB1f52DDA23136dDCBb9A63ED"),
  claim:         env("VITE_ADDR_CLAIM",         "0x5800395587731311D913208b5197b9DD37a51d35"),
  fingersStaking:env("VITE_ADDR_FSTAKING",      "0x193A4E8EB44f2D22De944f905B944f0feD52e8e4"),
  zap:           env("VITE_ADDR_ZAP",           Z),
  // Owner tooling / manual-LP peripherals (not user-facing swaps)
  hook:          env("VITE_ADDR_HOOK",          "0x571462dcAe834e6767F50EcC3944f28D38a74044"),
  migrator:      env("VITE_ADDR_MIGRATOR",      "0xb5dfc88094A7A1E92D7318ae1C2224922FEa6f0a"),
  seeder:        env("VITE_ADDR_SEEDER",        "0xdAc80c0d04fdbA30950844DDac99eD6D5Cc58360"),
} as const;

export const isDeployed = (a: Address) => a !== Z;

export const abi = {
  game: FingersMeABI,
  token: FingersTokenABI,
  winnerNFT: FingersWinnerNFTABI,
  loserNFT: FingersLoserNFTABI,
  nftStaking: FingersNFTStakingABI,
  claim: FingersClaimABI,
  fingersStaking: FingersStakingABI,
  zap: FingersZapABI,
} as const;

// Standard ERC20 read/approve fragment for USDG.
export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "v", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;
