import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { addresses, abi, isDeployed } from "../lib/contracts";

const USDG_DECIMALS = 6;

// raiseInfo() tuple:
// [round, winnerCap, deadline, timeLeft, live, totalWinners, totalLosers, totalAttempts, totalUsdgCollected, winUsdgRetained]
export function CountdownBar() {
  const deployed = isDeployed(addresses.game);
  const { data } = useReadContract({
    address: addresses.game, abi: abi.game, functionName: "raiseInfo",
    query: { enabled: deployed, refetchInterval: 15_000 },
  });
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t); }, []);

  if (!data) return null;
  const r = data as unknown as [bigint, bigint, bigint, bigint, boolean, bigint, bigint, bigint, bigint, bigint];
  const [round, winnerCap, deadline, , live, totalWinners, , , totalUsdgCollected] = r;

  const secsLeft = Math.max(0, Number(deadline) - now);
  const d = Math.floor(secsLeft / 86400);
  const h = Math.floor((secsLeft % 86400) / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);
  const s = secsLeft % 60;
  const pct = winnerCap > 0n ? Math.min(100, Number((totalWinners * 100n) / winnerCap)) : 0;
  const raised = Number(formatUnits(totalUsdgCollected, USDG_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const Cell = ({ v, k }: { v: number; k: string }) => (
    <div className="cd-cell"><div className="cd-num mono">{String(v).padStart(2, "0")}</div><div className="cd-lab">{k}</div></div>
  );

  return (
    <div className="card glow cd-wrap" style={{ marginBottom: 18 }}>
      <div className="cd-head">
        <div>
          <div className="cd-title">{live ? "⏳ Raise is LIVE — ends in" : secsLeft === 0 ? "⛔ Raise window closed" : "⏸️ Paused"}</div>
          <div className="cd-sub">Round <b>{round.toString()}</b> · whatever's raised by the buzzer is the raise</div>
        </div>
        <div className="cd-clock">
          <Cell v={d} k="days" /><span className="cd-sep">:</span>
          <Cell v={h} k="hrs" /><span className="cd-sep">:</span>
          <Cell v={m} k="min" /><span className="cd-sep">:</span>
          <Cell v={s} k="sec" />
        </div>
      </div>
      <div className="cd-meta">
        <span className="badge win">👑 {totalWinners.toLocaleString()} / {winnerCap.toLocaleString()} winners</span>
        <span className="badge gold">💵 {raised} USDG raised</span>
      </div>
      <div className="pbar" style={{ marginTop: 10 }}><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
