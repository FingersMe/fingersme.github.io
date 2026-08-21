import { useState } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { addresses, abi, isDeployed } from "../lib/contracts";

const usd = (n: number, d = 0) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: d });
const compact = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toFixed(0);

const SCENARIOS = [
  { label: "10K winners (early)", v: 10_000 },
  { label: "100K winners", v: 100_000 },
  { label: "1M winners (max)", v: 1_000_000 },
];

export function CalcPanel() {
  const on = isDeployed(addresses.game);
  const { data: mp } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "mintPrice", query: { enabled: on } });
  const { data: wc } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "winChanceBp", query: { enabled: on } });

  const [spend, setSpend] = useState(100);
  const [nvda, setNvda] = useState(170);
  const [proj, setProj] = useState(10_000);
  const [mult, setMult] = useState(3);
  const [lpBoost, setLpBoost] = useState(0); // % of the team sink added to LP (0–100)
  const [rides, setRides] = useState(1); // double-or-nothing: consecutive "let it ride" flips

  const playCostNvda = mp ? Number(formatUnits(mp as bigint, 18)) : 0.005;
  const winP = wc ? Number(wc) / 10000 : 0.4;
  const EMISSION = 50_000_000, SUPPLY = 100_000_000;

  const playCostUsd = playCostNvda * nvda;
  const plays = playCostUsd > 0 ? spend / playCostUsd : 0;
  const wins = plays * winP;
  const losses = plays * (1 - winP);

  const tokensPerWin = proj > 0 ? EMISSION / proj : 0;
  const yourTokens = wins * tokensPerWin;
  // LP NVDA = all wins (proj × cost) + optional sink top-up (75% of losses × lpBoost%)
  const lpWinsNvda = proj * playCostNvda;
  const totalLossesNvda = (proj / winP) * (1 - winP) * playCostNvda;
  const lpBoostNvda = totalLossesNvda * 0.75 * (lpBoost / 100);
  const lpNvda = lpWinsNvda + lpBoostNvda;
  const launchPriceUsd = EMISSION > 0 ? (lpNvda / EMISSION) * nvda : 0;

  const fingersLaunch = yourTokens * launchPriceUsd;
  const fingersAtMult = fingersLaunch * mult;
  const sellback = wins * playCostUsd * 0.75;
  const breakEven = fingersLaunch > 0 ? spend / fingersLaunch : 0;
  const net = fingersAtMult - spend;
  const roi = spend > 0 ? (net / spend) * 100 : 0;
  const fdv = launchPriceUsd * SUPPLY;

  const payoff = [1, breakEven, 5, 10].filter((m, i, a) => m > 0 && a.indexOf(m) === i).sort((a, b) => a - b);

  // 🎲 Double-or-nothing on the emission claim. Each flip is a fair 50/50: win pays up to 2× (bonus
  // from the shared jackpot), lose feeds the jackpot. Supply-neutral PvP — no burn, no mint. Letting a
  // claim "ride" N flips: P(survive) = 0.5^N, payout if you survive = 2^N × (value at that flip).
  const safeClaimUsd = fingersLaunch; // your emission $FINGERS at launch price (the "safe Claim")
  const rideSurvive = Math.pow(0.5, rides);
  const ridePayout = safeClaimUsd * Math.pow(2, rides);
  const rideEv = safeClaimUsd; // fair coin → EV stays flat; you trade certainty for variance

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card glow">
        <div className="an-head"><h2>🧮 Returns calculator</h2><span className="badge win">live params</span></div>
        <p className="sub" style={{ marginBottom: 14 }}>Estimate your bag before you play. Uses the live on-chain price ({playCostNvda} NVDA/play) and {Math.round(winP * 100)}% win odds. Numbers are projections — outcomes are a gamble, $FINGERS price is a market. Not financial advice.</p>

        <div className="calc-inputs">
          <label className="calc-field"><span>Your spend</span>
            <div className="calc-money"><b>$</b><input type="number" min={1} value={spend} onChange={(e) => setSpend(Math.max(0, Number(e.target.value) || 0))} /></div>
            <div className="calc-quick">{[25, 100, 500, 1000].map((n) => <button key={n} className={`chip-btn ${spend === n ? "on" : ""}`} onClick={() => setSpend(n)}>${n}</button>)}</div>
          </label>
          <label className="calc-field"><span>NVDA price</span>
            <div className="calc-money"><b>$</b><input type="number" min={1} value={nvda} onChange={(e) => setNvda(Math.max(1, Number(e.target.value) || 1))} /></div>
          </label>
          <label className="calc-field"><span>Total winners at close</span>
            <select value={proj} onChange={(e) => setProj(Number(e.target.value))}>
              {SCENARIOS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="calc-out">
          <Out k="You play" v={`${compact(plays)}×`} sub={`${usd(playCostUsd, 2)} each`} />
          <Out k="Expected wins" v={compact(wins)} sub={`${Math.round(winP * 100)}% odds`} up />
          <Out k="$FINGERS earned" v={compact(yourTokens)} sub="tokens (staked)" up />
          <Out k="Sell-back cash" v={usd(sellback, 0)} sub="75% of wins now" />
        </div>
      </div>

      {/* Hero payoff */}
      <div className="card glow calc-hero">
        <div className="calc-hero-top">
          <div>
            <div className="calc-hero-k">YOUR $FINGERS AT <span className="up">{mult}×</span></div>
            <div className="calc-hero-v mono up">{usd(fingersAtMult, 0)}</div>
            <div className={`calc-hero-roi mono ${roi >= 0 ? "up" : "dn"}`}>{roi >= 0 ? "+" : ""}{roi.toFixed(0)}% vs your {usd(spend)}</div>
          </div>
          <div className="calc-hero-meta">
            <div><span className="k">Launch price</span><span className="v mono">${launchPriceUsd.toPrecision(2)}</span></div>
            <div><span className="k">Launch FDV</span><span className="v mono">{usd(fdv, 0)}</span></div>
            <div><span className="k">Break-even</span><span className="v mono up">{breakEven.toFixed(1)}×</span></div>
          </div>
        </div>
        <label className="calc-slider">
          <div className="row" style={{ justifyContent: "space-between" }}><span>$FINGERS price multiple</span><b className="mono up">{mult}×</b></div>
          <input type="range" min={1} max={20} step={0.5} value={mult} onChange={(e) => setMult(Number(e.target.value))} />
        </label>
        <label className="calc-slider">
          <div className="row" style={{ justifyContent: "space-between" }}><span>Team adds sink → LP (deeper pool, higher floor)</span><b className="mono up">{lpBoost}%</b></div>
          <input type="range" min={0} max={100} step={5} value={lpBoost} onChange={(e) => setLpBoost(Number(e.target.value))} />
        </label>
      </div>

      {/* Payoff table + NFT yield */}
      <div className="grid two">
        <div className="card glow">
          <h2>Payoff ladder</h2>
          <p className="sub">What your {compact(yourTokens)} $FINGERS is worth as the price moves.</p>
          <div className="ladder">
            {payoff.map((m) => {
              const val = fingersLaunch * m, r = spend > 0 ? ((val - spend) / spend) * 100 : 0;
              const be = Math.abs(m - breakEven) < 0.05;
              return (
                <div key={m} className={`ladder-row ${be ? "be" : ""}`}>
                  <span className="mono">{m.toFixed(1)}×{be ? " · break-even" : ""}</span>
                  <span className="mono">{usd(val, 0)}</span>
                  <span className={`mono ${r >= 0 ? "up" : "dn"}`}>{r >= 0 ? "+" : ""}{r.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card glow">
          <h2>👑 Your NFTs keep earning</h2>
          <p className="sub">Each Winner NFT you stake is a productive asset — beyond the $FINGERS above:</p>
          <ul className="trust" style={{ marginTop: 6 }}>
            <li><b>NVDA yield forever-ish:</b> your {compact(wins)} staked NFTs earn a pro-rata slice of <b>25% of every loss</b> — paid in real NVDA while the game runs.</li>
            <li><b>$FINGERS emission:</b> the {compact(yourTokens)} above streams over 90 days — the earlier & more you stake, the bigger your share.</li>
            <li><b>Exit option:</b> sell any Winner back for 75% (~{usd(sellback, 0)} total) if you'd rather take cash than hold.</li>
            <li><b>Deflation tailwind:</b> a 1% buy/sell fee buys back &amp; burns $FINGERS forever — fewer tokens, higher floor.</li>
          </ul>
        </div>
      </div>

      {/* Double or nothing */}
      <div className="card glow">
        <div className="an-head"><h2>🎲 Double-or-nothing on your claim</h2><span className="badge win">optional · 50/50</span></div>
        <p className="sub" style={{ marginBottom: 14 }}>
          Instead of banking your <b>{compact(yourTokens)} $FINGERS</b> ({usd(safeClaimUsd, 0)} at launch price), you can flip it. Each flip is a provably-fair coin: <b>win → up to 2×</b> (bonus from the shared jackpot), <b>lose → it feeds the jackpot</b>. No burn, no mint — pure player-vs-player. It's a spice tool, not a money printer: the fair coin keeps your <b>expected</b> value flat while blowing up the variance.
        </p>
        <div className="calc-out">
          <Out k="Bank it (safe)" v={usd(safeClaimUsd, 0)} sub="the plain Claim" />
          <Out k={`Ride ${rides}× → payout`} v={usd(ridePayout, 0)} sub={`${(2 ** rides)}× your claim`} up />
          <Out k="Odds you survive" v={`${(rideSurvive * 100).toFixed(rides > 3 ? 1 : 0)}%`} sub={`0.5^${rides}`} />
          <Out k="Expected value" v={usd(rideEv, 0)} sub="fair coin, flat EV" />
        </div>
        <label className="calc-slider" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}><span>Let it ride — consecutive flips</span><b className="mono up">{rides}×</b></div>
          <input type="range" min={1} max={8} step={1} value={rides} onChange={(e) => setRides(Number(e.target.value))} />
        </label>
        <div className="hint" style={{ marginTop: 4 }}>
          Assumes the jackpot is deep enough to pay the full 2× bonus each flip; if it's thinner, a win pays between 1× and 2×. The safe <b>Claim</b> is always one tap away — you only gamble what you choose to.
        </div>
      </div>
    </div>
  );
}

function Out({ k, v, sub, up }: { k: string; v: string; sub?: string; up?: boolean }) {
  return <div className="calc-outcell"><div className="k">{k}</div><div className={`v mono ${up ? "up" : ""}`}>{v}</div>{sub && <div className="s">{sub}</div>}</div>;
}
