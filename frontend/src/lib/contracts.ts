import { formatUnits, type Address } from "viem";
import {
  FingersMeABI, FingersTokenABI, FingersWinnerNFTABI, FingersLoserNFTABI,
  FingersNFTStakingABI, FingersClaimABI, FingersStakingABI, FingersZapABI, FingersLPMigratorABI,
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
  // Payment / quote token = NVDA (NVIDIA • Robinhood RWA). Key kept as `usdg` (the quote slot).
  usdg:          env("VITE_ADDR_USDG",          "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC"),
  game:          env("VITE_ADDR_GAME",          "0xA4a24B8F6CD2b3E3c47FA61BAFa20ef9d0aAB4a4"),
  token:         env("VITE_ADDR_TOKEN",         "0x9647bC7E91DCb14D4d641385847674c8d0058da2"),
  winnerNFT:     env("VITE_ADDR_WINNER",        "0xdAdae0bAeB093A6D5AfAff39b708fd0C540230d9"),
  loserNFT:      env("VITE_ADDR_LOSER",         "0x18E4aFd848Cc33f898A5f02B1741338ecc785dF4"),
  nftStaking:    env("VITE_ADDR_NFTSTAKING",    "0x5b1d0C2F7c39f3d3E5211bE6E751A83194f20903"),
  claim:         env("VITE_ADDR_CLAIM",         Z),
  fingersStaking:env("VITE_ADDR_FSTAKING",      "0x1f49c1Dd8d2E92A75828355757567ed544C607b0"),
  zap:           env("VITE_ADDR_ZAP",           Z),
  // Auto-LP + owner tooling
  hook:          env("VITE_ADDR_HOOK",          "0xcE7BD302c421E7DF0Ea64d5276AB0559a5b2c044"),
  migrator:      env("VITE_ADDR_MIGRATOR",      "0x6C15C31f3817CDf7Aa3445C2c0c00d35b3968fD3"),
  seeder:        env("VITE_ADDR_SEEDER",        "0x20AAa1438B7A2685e707F99185287938A17b6986"),
} as const;

export const isDeployed = (a: Address) => a !== Z;

// ── Payment token (the presale settles in NVDA — the "first RWA presale") ──
export const PAY = { symbol: "NVDA", name: "NVIDIA • Robinhood", decimals: 18 } as const;

/**
 * Format a NVDA amount for display. Big numbers get 2–4 dp; small numbers keep enough
 * decimals to stay visible (up to `smallMax`, default 10) instead of rounding to "0.00".
 */
export function fmtPay(v?: bigint, opts?: { smallMax?: number; bigMax?: number }): string {
  if (v === undefined || v === null) return "—";
  const s = formatUnits(v, PAY.decimals);
  if (!s.includes(".")) return Number(s).toLocaleString();
  const [intPart, fracRaw] = s.split(".");
  const big = intPart !== "0" && intPart !== "-0";
  const max = big ? (opts?.bigMax ?? 4) : (opts?.smallMax ?? 10);
  const frac = fracRaw.slice(0, max).replace(/0+$/, "");
  const intFmt = big ? Number(intPart).toLocaleString() : intPart;
  return frac ? `${intFmt}.${frac}` : intFmt;
}

export const abi = {
  game: FingersMeABI,
  token: FingersTokenABI,
  winnerNFT: FingersWinnerNFTABI,
  loserNFT: FingersLoserNFTABI,
  nftStaking: FingersNFTStakingABI,
  claim: FingersClaimABI,
  fingersStaking: FingersStakingABI,
  zap: FingersZapABI,
  migrator: FingersLPMigratorABI,
} as const;

// Standard ERC20 read/approve fragment for USDG.
export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "v", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;
