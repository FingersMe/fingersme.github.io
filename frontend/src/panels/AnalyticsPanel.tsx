import { useReadContract } from "wagmi";
import { addresses, abi, isDeployed, fmtPay } from "../lib/contracts";

const usd = (v: unknown) => fmtPay(v as bigint | undefined);
const num = (v: unknown) => v === undefined ? "—" : (v as bigint).toLocaleString();

function useGame(fn: string, enabled: boolean) {
  return useReadContract({ address: addresses.game, abi: abi.game, functionName: fn as any, query: { enabled, refetchInterval: 15_000 } }).data;
}

export function AnalyticsPanel() {
  const on = isDeployed(addresses.game);
  const ri = useGame("raiseInfo", on) as any[] | undefined;
  const sinkFlushed = useGame("sinkFlushed", on);
  const stakerFlushed = useGame("stakerFlushed", on);
  const winWithdrawn = useGame("winWithdrawn", on);
  const sinkAccrued = useGame("sinkAccrued", on);
  const stakerAccrued = useGame("stakerAccrued", on);
  const freeGranted = useGame("freeCreditsGranted", on);
  const freeUsed = useGame("freeCreditsUsed", on);
  const claimOpened = useReadContract({ address: addresses.claim, abi: abi.claim, functionName: "opened", query: { enabled: isDeployed(addresses.claim), refetchInterval: 15_000 } }).data;
  const winnerSupply = useReadContract({ address: addresses.winnerNFT, abi: abi.winnerNFT, functionName: "totalSupply", query: { enabled: isDeployed(addresses.winnerNFT), refetchInterval: 15_000 } }).data;

  if (!on) return <div className="card glow"><div className="notice">Analytics light up once the game is wired.</div></div>;

  const round = ri?.[0], cap = ri?.[1], winners = ri?.[5] as bigint | undefined, losers = ri?.[6] as bigint | undefined,
    attempts = ri?.[7] as bigint | undefined, raised = ri?.[8], retained = ri?.[9];
  const settled = (winners ?? 0n) + (losers ?? 0n);
  const winRate = settled > 0n ? Number((winners! * 10000n) / settled) / 100 : 0;
  const capPct = cap && cap > 0n ? Math.min(100, Number((winners! * 100n) / (cap as bigint))) : 0;

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card glow">
        <h2>📊 Live analytics</h2>
        <p className="sub">Everything below is read straight from the chain — the raise, the split, the burn on free plays. No off-chain fudging.</p>
        <div className="statbar" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="stat"><div className="k">Round</div><div className="v gold">{num(round)}</div></div>
          <div className="stat"><div className="k">Winners</div><div className="v green">{num(winners)}</div></div>
          <div className="stat"><div className="k">Losers</div><div className="v">{num(losers)}</div></div>
          <div className="stat"><div className="k">Total plays</div><div className="v">{num(attempts)}</div></div>
          <div className="stat"><div className="k">Live win rate</div><div className="v green">{winRate}%</div></div>
          <div className="stat"><div className="k">NVDA raised</div><div className="v gold">{usd(raised)}</div></div>
          <div className="stat"><div className="k">Winner NFTs live</div><div className="v">{num(winnerSupply)}</div></div>
          <div className="stat"><div className="k">Claim</div><div className="v">{claimOpened ? "OPEN" : "closed"}</div></div>
        </div>
        <div className="hint" style={{ marginTop: 4 }}>Round {num(round)} progress toward the {num(cap)} tier</div>
        <div className="pbar" style={{ marginTop: 6 }}><span style={{ width: `${capPct}%` }} /></div>
      </div>

      <div className="grid two">
        <div className="card glow">
          <h2>💸 Where the money is</h2>
          <div className="mflow" style={{ marginTop: 6 }}>
            <div className="mrow"><span className="tag2 t-house">WIN retained</span><span className="arrow">→</span><p>{usd(retained)} NVDA waiting for LP · {usd(winWithdrawn)} already withdrawn</p></div>
            <div className="mrow"><span className="tag2 t-lose">Stakers (25%)</span><span className="arrow">→</span><p>{usd(stakerAccrued)} pending · {usd(stakerFlushed)} paid out</p></div>
            <div className="mrow"><span className="tag2 t-lose">Sink (75%)</span><span className="arrow">→</span><p>{usd(sinkAccrued)} pending · {usd(sinkFlushed)} sent</p></div>
          </div>
        </div>
        <div className="card glow">
          <h2>🎟️ Free plays & mix</h2>
          <div className="statbar" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
            <div className="stat"><div className="k">Free credits granted</div><div className="v">{num(freeGranted)}</div></div>
            <div className="stat"><div className="k">Free plays used</div><div className="v">{num(freeUsed)}</div></div>
          </div>
          <div className="hint" style={{ marginTop: 12 }}>Win/Lose split of settled plays</div>
          <div className="pbar" style={{ marginTop: 6, background: "rgba(230,57,74,.25)" }}>
            <span style={{ width: `${winRate}%`, background: "linear-gradient(90deg, var(--lime), var(--gold))" }} />
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <span className="badge win">{num(winners)} win</span>
            <span className="badge lose">{num(losers)} lose</span>
          </div>
        </div>
      </div>
    </div>
  );
}
