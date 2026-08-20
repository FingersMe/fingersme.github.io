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

// Live Robinhood mainnet (chainId 4663) v2 deployment — 2026-08-20. All addresses are PUBLIC and
// safe to ship; they are baked as defaults so the static (GitHub Pages) build is wired without an
// .env. A VITE_ADDR_* env var still overrides any of them for local/preview against another deploy.
export const addresses = {
  usdg:          env("VITE_ADDR_USDG",          "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"),
  game:          env("VITE_ADDR_GAME",          "0xe578bE124692943AcdE8bd0644D9bbBC20984ae0"),
  token:         env("VITE_ADDR_TOKEN",         "0xbC1f0e44865cB0c3209019eEE1C1FB3273cCE95f"),
  winnerNFT:     env("VITE_ADDR_WINNER",        "0xCec8901CEeb6d85f890A29e75B2C59eC0d85D11c"),
  loserNFT:      env("VITE_ADDR_LOSER",         "0x83dE621D2Ce8E14CAEe637e5E643Ae4E94B6C184"),
  nftStaking:    env("VITE_ADDR_NFTSTAKING",    "0x10832aD8f5A669b70889558aD053462c1014675f"),
  claim:         env("VITE_ADDR_CLAIM",         "0x5934039Bc659De0feACc108aDfC21248e8b5bf91"),
  fingersStaking:env("VITE_ADDR_FSTAKING",      "0x3c180fd73f5315Da12bcae3e11F28F74333e9ED6"),
  zap:           env("VITE_ADDR_ZAP",           Z),
  // Owner tooling / manual-LP peripherals (not user-facing swaps)
  hook:          env("VITE_ADDR_HOOK",          "0x907a48c9a3D9611cee76bF98A0b56b6534ecC044"),
  migrator:      env("VITE_ADDR_MIGRATOR",      "0x20ad7aB5e4d11Af3d8993Bbee4dF96019D225D5d"),
  seeder:        env("VITE_ADDR_SEEDER",        "0xa1B6C37C6023c7cb5107d0a8dea48FA9f254b494"),
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
