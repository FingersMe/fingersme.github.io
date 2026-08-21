import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { addresses, abi, erc20Abi, isDeployed, fmtPay, PAY } from "../lib/contracts";

const num = (v: unknown) => v === undefined ? "—" : (v as bigint).toLocaleString();
const f18 = (v?: bigint, max = 2) => v === undefined ? "—" : Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: max });

function gRead(fn: string, enabled: boolean, addr = addresses.game, ab: any = abi.game, args?: any[]) {
  return useReadContract({ address: addr, abi: ab, functionName: fn as any, args, query: { enabled, refetchInterval: 15_000 } }).data;
}

export function AnalyticsPanel() {
  const on = isDeployed(addresses.game);
  const ri = gRead("raiseInfo", on) as any[] | undefined;
  const sinkFlushed = gRead("sinkFlushed", on) as bigint | undefined;
  const stakerFlushed = gRead("stakerFlushed", on) as bigint | undefined;
  const sinkAccrued = gRead("sinkAccrued", on) as bigint | undefined;
  const stakerAccrued = gRead("stakerAccrued", on) as bigint | undefined;
  const supply = gRead("totalSupply", isDeployed(addresses.token), addresses.token, abi.token) as bigint | undefined;
  const totalStaked = gRead("totalStaked", isDeployed(addresses.nftStaking), addresses.nftStaking, abi.nftStaking) as bigint | undefined;
  const emInfo = gRead("fingersEmissionInfo", isDeployed(addresses.nftStaking), addresses.nftStaking, abi.nftStaking) as any[] | undefined;
  const winnerSupply = gRead("totalSupply", isDeployed(addresses.winnerNFT), addresses.winnerNFT, abi.winnerNFT) as bigint | undefined;
  // NVDA already flushed to the migrator + still in the game's WIN bucket = total LP-bound NVDA
  const migNvda = useReadContract({ address: addresses.usdg, abi: erc20Abi, functionName: "balanceOf", args: [addresses.migrator], query: { enabled: isDeployed(addresses.migrator), refetchInterval: 15_000 } }).data as bigint | undefined;

  if (!on) return <div className="card glow"><div className="notice">Analytics light up once the game is wired.</div></div>;

  const round = ri?.[0], cap = ri?.[1] as bigint | undefined, winners = (ri?.[5] as bigint | undefined) ?? 0n,
    losers = (ri?.[6] as bigint | undefined) ?? 0n, attempts = ri?.[7] as bigint | undefined,
    raised = ri?.[8] as bigint | undefined, winRetained = (ri?.[9] as bigint | undefined) ?? 0n;

  const settled = winners + losers;
  const winRate = settled > 0n ? Number((winners * 10000n) / settled) / 100 : 0;
  const capPct = cap && cap > 0n ? Math.min(100, Number((winners * 100n) / cap)) : 0;

  // LP-bound NVDA = flushed-to-migrator + still-in-game WIN bucket
  const lpNvda = (migNvda ?? 0n) + winRetained;
  const LP_FINGERS = 50_000_000n * 10n ** 18n;
  // implied launch price (NVDA per FINGERS) once the pool graduates at 50M : lpNvda
  const impliedPrice = lpNvda > 0n ? Number(formatUnits(lpNvda, 18)) / 50_000_000 : 0;
  const fdv = impliedPrice * 100_000_000; // × fixed supply, in NVDA
  const emRecognized = emInfo?.[3] as bigint | undefined, emTotal = (emInfo?.[4] as bigint | undefined) ?? LP_FINGERS;
  const emPct = emTotal > 0n ? Math.min(100, Number(((emRecognized ?? 0n) * 100n) / emTotal)) : 0;

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* KPI row */}
      <div className="kpis">
        <Kpi k="Round" v={num(round)} />
        <Kpi k="Total plays" v={num(attempts)} />
        <Kpi k="Win rate" v={`${winRate}%`} accent />
        <Kpi k={`NVDA raised`} v={fmtPay(raised)} accent />
        <Kpi k="Implied price" v={impliedPrice ? `${impliedPrice.toPrecision(3)}` : "—"} sub="NVDA/FGR" />
        <Kpi k="Implied FDV" v={fdv ? `${fdv.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"} sub="NVDA" accent />
      </div>

      {/* Raise progress + win/loss */}
      <div className="grid two">
        <div className="card glow">
          <div className="an-head"><h2>Raise progress</h2><span className="badge win">{ri?.[4] ? "LIVE" : "closed"}</span></div>
          <p className="sub" style={{ marginBottom: 10 }}>Round {num(round)} filling the {num(cap)} winner tier — auto-escalates ×10 up to 1,000,000.</p>
          <Meter pct={capPct} label={`${num(winners)} / ${num(cap)} winners`} />
          <div className="an-mini" style={{ marginTop: 14 }}>
            <Mini k="Winners" v={num(winners)} up />
            <Mini k="Losers" v={num(losers)} down />
            <Mini k="Winner NFTs live" v={num(winnerSupply)} />
          </div>
        </div>
        <div className="card glow">
          <div className="an-head"><h2>Win / loss split</h2><span className="badge win">{winRate}% win</span></div>
          <div className="an-donut">
            <Donut win={Number(winners)} lose={Number(losers)} />
            <div className="an-legend">
              <div><span className="dot up" /> {num(winners)} wins</div>
              <div><span className="dot down" /> {num(losers)} losses</div>
              <div className="an-legend-sub">{num(settled)} settled · 40% target</div>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidity & price */}
      <div className="card glow">
        <div className="an-head"><h2>Liquidity engine (FINGERS / NVDA)</h2><span className="badge gold">auto-LP</span></div>
        <p className="sub" style={{ marginBottom: 12 }}>Every win's NVDA is bound for a permanently-locked pool paired with 50M $FINGERS. Depth and launch price grow with the raise — the team custodies none of it.</p>
        <div className="kpis">
          <Kpi k="LP NVDA (locked-bound)" v={fmtPay(lpNvda)} accent />
          <Kpi k="LP $FINGERS" v={f18(LP_FINGERS, 0)} />
          <Kpi k="Circulating supply" v={f18(supply, 0)} sub="/ 100,000,000" />
          <Kpi k="NVDA staker/sink flow" v={`${fmtPay((stakerFlushed ?? 0n) + (stakerAccrued ?? 0n))} / ${fmtPay((sinkFlushed ?? 0n) + (sinkAccrued ?? 0n))}`} sub="stakers / sink" />
        </div>
      </div>

      {/* Money flow + emission */}
      <div className="grid two">
        <div className="card glow">
          <h2>Where the NVDA goes</h2>
          <div className="mflow" style={{ marginTop: 8 }}>
            <div className="mrow"><span className="tag2 t-win">WIN → LP</span><span className="arrow">→</span><p><b>{fmtPay(lpNvda)}</b> NVDA locked-bound for the pool (team can't touch it)</p></div>
            <div className="mrow"><span className="tag2 t-lose">25% stakers</span><span className="arrow">→</span><p>{fmtPay(stakerAccrued)} pending · {fmtPay(stakerFlushed)} paid</p></div>
            <div className="mrow"><span className="tag2 t-lose">75% sink</span><span className="arrow">→</span><p>{fmtPay(sinkAccrued)} pending · {fmtPay(sinkFlushed)} sent</p></div>
          </div>
        </div>
        <div className="card glow">
          <div className="an-head"><h2>$FINGERS emission</h2><span className="badge win">{(emInfo?.[0] as bigint | undefined) && (emInfo![0] as bigint) > 0n ? "LIVE" : "pending"}</span></div>
          <p className="sub" style={{ marginBottom: 10 }}>50M streams to NFT stakers over 90 days — auto-starts on the first stake, split by staked count.</p>
          <Meter pct={emPct} label={`${f18(emRecognized, 0)} / ${f18(emTotal, 0)} emitted`} />
          <div className="an-mini" style={{ marginTop: 14 }}>
            <Mini k="Winners staked" v={num(totalStaked)} up />
            <Mini k="Days left" v={emInfo?.[2] ? Math.floor(Number(emInfo[2]) / 86400).toString() : "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ k, v, sub, accent }: { k: string; v: string; sub?: string; accent?: boolean }) {
  return (
    <div className="kpi">
      <div className="kpi-k">{k}</div>
      <div className={`kpi-v mono ${accent ? "up" : ""}`}>{v}</div>
      {sub && <div className="kpi-sub mono">{sub}</div>}
    </div>
  );
}
function Mini({ k, v, up, down }: { k: string; v: string; up?: boolean; down?: boolean }) {
  return <div className="an-minicell"><div className="k">{k}</div><div className={`v mono ${up ? "up" : down ? "dn" : ""}`}>{v}</div></div>;
}
function Meter({ pct, label }: { pct: number; label: string }) {
  return (
    <>
      <div className="an-meter"><span style={{ width: `${pct}%` }} /></div>
      <div className="an-meter-lbl mono">{label} · {pct.toFixed(1)}%</div>
    </>
  );
}
function Donut({ win, lose }: { win: number; lose: number }) {
  const total = Math.max(1, win + lose);
  const r = 46, C = 2 * Math.PI * r;
  const winLen = (win / total) * C;
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden>
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--down)" strokeWidth="16" opacity="0.55" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--green)" strokeWidth="16"
        strokeDasharray={`${winLen} ${C - winLen}`} strokeDashoffset={C / 4} transform="rotate(-90 66 66)" strokeLinecap="round" />
      <text x="66" y="62" textAnchor="middle" className="mono" fill="var(--text)" fontSize="22" fontWeight="800">{Math.round((win / total) * 100)}%</text>
      <text x="66" y="80" textAnchor="middle" className="mono" fill="var(--muted)" fontSize="10">WIN</text>
    </svg>
  );
}
