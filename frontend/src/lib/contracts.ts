import { formatUnits, type Address } from "viem";
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
  // Payment / quote token = NVDA (NVIDIA • Robinhood RWA). Key kept as `usdg` (the quote slot).
  usdg:          env("VITE_ADDR_USDG",          "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC"),
  game:          env("VITE_ADDR_GAME",          "0xaa56e7c3DFA0aFD4BcE07B8F199D407B9B2773e7"),
  token:         env("VITE_ADDR_TOKEN",         "0x373e9aF0d31EaB9e7A461c736Cc9314f4C05FbBf"),
  winnerNFT:     env("VITE_ADDR_WINNER",        "0x11784c7925b8F01B507DD6f6cefb8Eaf162a5c27"),
  loserNFT:      env("VITE_ADDR_LOSER",         "0xada2AcC79F15Aa23766Fa7832dF65E3d1F256874"),
  nftStaking:    env("VITE_ADDR_NFTSTAKING",    "0xF0638115CEade6eF789b9925039e0342275eed9F"),
  claim:         env("VITE_ADDR_CLAIM",         Z),
  fingersStaking:env("VITE_ADDR_FSTAKING",      "0xfDb7E5C5ed42b279860bb0cFaDe0102F4637C003"),
  zap:           env("VITE_ADDR_ZAP",           Z),
  // Owner tooling / manual-LP peripherals (not user-facing swaps)
  hook:          env("VITE_ADDR_HOOK",          "0x9c97C060f6bd4F49aeD662825bBc86Bbd850c044"),
  migrator:      env("VITE_ADDR_MIGRATOR",      "0xC803a6C3c8ca7fE8867aC16A83a4f49ce5A142Af"),
  seeder:        env("VITE_ADDR_SEEDER",        "0x908803b8344874863cdB0D4273A70a7808f0054c"),
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
} as const;

// Standard ERC20 read/approve fragment for USDG.
export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "v", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;
