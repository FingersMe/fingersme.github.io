import { useEffect, useState } from "react";
import { addresses } from "./contracts";

// Live USD prices from the Robinhood token index (li.quest). USDG is the dollar-pegged quote,
// so NVDA's priceUSD is a real market price; FINGERS is ~0 until its pool graduates. We cache
// module-level and poll gently so every panel shares one fetch, not N.

const CHAIN = 4663;
const FALLBACK_NVDA = 217; // sane default if the price feed is unreachable
type Prices = { nvdaUsd: number; fingersUsd: number; loaded: boolean };

let cache: Prices = { nvdaUsd: FALLBACK_NVDA, fingersUsd: 0, loaded: false };
const subs = new Set<(p: Prices) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

async function fetchOne(token: string): Promise<number | null> {
  try {
    const r = await fetch(`https://li.quest/v1/token?chain=${CHAIN}&token=${token}`);
    const j = await r.json();
    const p = Number(j?.priceUSD);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch { return null; }
}

async function refresh() {
  const [nvda, fingers] = await Promise.all([fetchOne(addresses.usdg), fetchOne(addresses.token)]);
  cache = {
    nvdaUsd: nvda ?? cache.nvdaUsd ?? FALLBACK_NVDA,
    fingersUsd: fingers ?? cache.fingersUsd ?? 0,
    loaded: true,
  };
  subs.forEach((fn) => fn(cache));
}

/** Shared live USD prices for NVDA + FINGERS. */
export function usePrices(): Prices {
  const [p, setP] = useState<Prices>(cache);
  useEffect(() => {
    subs.add(setP);
    if (!cache.loaded) refresh();
    if (!timer) timer = setInterval(refresh, 60_000);
    return () => {
      subs.delete(setP);
      if (subs.size === 0 && timer) { clearInterval(timer); timer = null; }
    };
  }, []);
  return p;
}

/** Format a USD number compactly: "$1.09", "$4,320", "$1.2M". */
export function usd(n: number, opts?: { max?: number }): string {
  if (!Number.isFinite(n)) return "$—";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const max = opts?.max ?? (n < 1 ? 2 : 2);
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: max, minimumFractionDigits: n < 100 ? 2 : 0 });
}
