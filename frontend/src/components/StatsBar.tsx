import type { ReactNode } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { addresses, abi, erc20Abi, isDeployed } from "../lib/contracts";

const MAX_WINNERS = 1_000_000n;

export function StatsBar() {
  const enabled = isDeployed(addresses.game);

  const { data, isLoading } = useReadContract({
    address: addresses.game, abi: abi.game, functionName: "stats",
    query: { enabled, refetchInterval: 12_000 },
  });
  const { data: dec } = useReadContract({
    address: addresses.usdg, abi: erc20Abi, functionName: "decimals",
    query: { enabled },
  });

  // stats(): [phase, totalAttempts, totalWinners, winnersRemaining, totalLosers,
  //           unsettled, totalUsdgCollected, winUsdgRetained, sinkAccrued, stakerAccrued]
  const s = data as readonly bigint[] | undefined;
  const usdgDecimals = (dec as number | undefined) ?? 6;

  // A stat is "ready" only when we actually have on-chain data — never show a fake 0.
  const ready = enabled && !!s;
  const loading = enabled && (isLoading || !s);

  const totalWinners = s?.[2];
  const totalLosers = s?.[4];
  const totalAttempts = s?.[1];
  const usdg = s?.[6];

  const settled = totalWinners !== undefined && totalLosers !== undefined ? totalWinners + totalLosers : undefined;
  const winRate = settled && settled > 0n ? Number((totalWinners! * 10000n) / settled) / 100 : undefined;
  const usdgHuman = usdg !== undefined ? Math.round(Number(formatUnits(usdg, usdgDecimals))).toLocaleString() : undefined;

  return (
    <div className="statbar">
      <Stat k="Winners minted" tone="gold"
        v={ready ? `${totalWinners!.toLocaleString()} / ${MAX_WINNERS.toLocaleString()}` : preLaunch(loading, `0 / ${MAX_WINNERS.toLocaleString()}`)} />
      <Stat k="Total plays"
        v={ready ? totalAttempts!.toLocaleString() : preLaunch(loading)} />
      <Stat k="NVDA wagered"
        v={ready ? usdgHuman! : preLaunch(loading)} />
      <Stat k="Live win rate" tone="green"
        v={ready ? `${(winRate ?? 40).toFixed(1)}%` : preLaunch(loading, "40.0%")} />
    </div>
  );
}

// Distinct pre-launch / loading states so we never render a misleading "0".
function preLaunch(loading: boolean, target?: string) {
  if (loading) return <span className="skel">0000</span>;
  return <span className="muted" title="Contracts not deployed to this build yet">{target ?? "—"}</span>;
}

function Stat({ k, v, tone }: { k: string; v: ReactNode; tone?: "gold" | "green" }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className={`v ${tone ?? ""}`}>{v}</div>
    </div>
  );
}
