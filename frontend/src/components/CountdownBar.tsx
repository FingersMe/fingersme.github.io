import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { addresses, abi, isDeployed, fmtPay, PAY } from "../lib/contracts";

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

  // Anchor to the CHAIN's own `timeLeft` (deadline − chain time), not deadline − browser time — the
  // Robinhood chain clock can drift from wall-clock, so this keeps the countdown accurate. We convert
  // it into a browser-relative end timestamp each refetch, then tick locally.
  const timeLeftChain = data ? Number((data as any[])[3] as bigint) : 0;
  const [endTs, setEndTs] = useState<number | null>(null);
  useEffect(() => {
    if (data) setEndTs(Math.floor(Date.now() / 1000) + timeLeftChain);
  }, [timeLeftChain, data]);

  if (!data || endTs === null) return null;
  const r = data as unknown as [bigint, bigint, bigint, bigint, boolean, bigint, bigint, bigint, bigint, bigint];
  const [round, winnerCap, , , live, totalWinners, , , totalUsdgCollected] = r;

  const secsLeft = Math.max(0, endTs - now);
  const d = Math.floor(secsLeft / 86400);
  const h = Math.floor((secsLeft % 86400) / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);
  const s = secsLeft % 60;
  const pct = winnerCap > 0n ? Math.min(100, Number((totalWinners * 100n) / winnerCap)) : 0;
  const raised = fmtPay(totalUsdgCollected);

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
        <span className="badge gold">💚 {raised} {PAY.symbol} raised</span>
      </div>
      <div className="pbar" style={{ marginTop: 10 }}><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
