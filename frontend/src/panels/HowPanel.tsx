import { motion } from "framer-motion";

const STEPS = [
  { n: "01", big: "🎰", h: "Pull the trigger", p: "Pay 0.005 NVDA per play (or swap any asset → NVDA in-app via LI.FI). Batch up to 50 rolls. Payment is taken up-front so nobody can peek before revealing." },
  { n: "02", big: "🎲", h: "Provably-fair roll", p: "The outcome is locked to the commit block's hash — 40% mints a Winner 👑, 60% a Loser badge 🌶️. Not you, not the team can grind it." },
  { n: "03", big: "👑", h: "Reveal your fate", p: "A block later you reveal and a WON / LOSE pop-up drops. Winners get a real asset NFT; losers keep a saucy badge forever. Anyone can settle a roll, so it never stalls." },
  { n: "04", big: "💰", h: "Put winners to work", p: "Stake Winner NFTs to earn a live NVDA yield off every loss AND a share of the 50M $FINGERS 90-day emission — both split by how many you stake." },
];

const NFT_CARDS = [
  { h: "👑 A real asset, not a jpeg", p: "A Winner NFT is a productive position — three ways to earn, all on-chain, all permissionless." },
  { k: "Earn", h2: "50M $FINGERS", p: "After the raise finalizes, 50,000,000 $FINGERS streams to Winner-NFT stakers over 90 days — split by how many you stake, so your share dilutes as more join." },
  { k: "Stake", h2: "for NVDA yield", p: "Stake Winner NFTs to earn the 25%-of-every-loss NVDA stream, split by NFT count. Un-gameable MasterChef accounting." },
  { k: "Boost & exit", h2: "", p: "Staked winners boost your $FINGERS staking too. Want out anytime? Sell a Winner back for 75% (a 25% loss)." },
];

export function HowPanel() {
  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* Intro */}
      <div className="card glow">
        <span className="nvda-chip" style={{ marginBottom: 12 }}><b>▲ NVDA</b> · first RWA presale</span>
        <h2 style={{ marginTop: 12 }}>🍗 How Fingers works</h2>
        <p className="sub" style={{ marginBottom: 0 }}>
          One crispy finger survived the fryer — legendary, crowned, ready to cook the charts. Fingers is the
          <b className="nvda-ink"> first RWA presale</b>: a provably-fair <b>gamble-to-mint</b> played with
          <b className="nvda-ink"> tokenized NVIDIA (NVDA)</b> for just <b>0.005 NVDA</b> a pull. Everything below is enforced on-chain.
        </p>
      </div>

      {/* The loop */}
      <div className="card glow">
        <div className="eyebrow">The loop</div>
        <h2>Pull, reveal, put winners to work</h2>
        <div className="flow" style={{ marginTop: 4 }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.n} className="flow-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="n">{s.n}</div>
              <div className="big">{s.big}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* The raise */}
      <div className="card glow">
        <div className="eyebrow">The mechanic</div>
        <h2>⏳ A 30-day, round-based raise</h2>
        <p className="sub">Fingers isn't a fixed sale — it's a countdown. Whatever's raised by the buzzer (or when the team bonds the token) is the raise.</p>
        <div className="mflow">
          <div className="mrow"><span className="tag2 t-win">ROUNDS</span><span className="arrow">→</span><p>Starts at a <b>100-winner</b> tier and auto-escalates ×10 (round 1→2→3…) up to a hard <b>1,000,000</b> ceiling. The more it fills, the bigger it gets.</p></div>
          <div className="mrow"><span className="tag2 t-house">COUNTDOWN</span><span className="arrow">→</span><p>A <b>30-day clock</b> runs at the top. When it hits zero, new plays stop — reveals still settle. The team can extend it.</p></div>
          <div className="mrow"><span className="tag2 t-lose">BOND</span><span className="arrow">→</span><p>The team can <b>finalize anytime</b>: plays close, the <b>90-day $FINGERS emission opens to stakers</b>, and the raised NVDA seeds locked liquidity.</p></div>
        </div>
      </div>

      {/* Money flow */}
      <div className="card glow">
        <div className="eyebrow">Follow the money</div>
        <h2>💸 Where every play goes</h2>
        <p className="sub">Each play's NVDA is routed by outcome into separate on-chain buckets — the split can't be dodged or quietly redirected.</p>
        <div className="mflow">
          <div className="mrow"><span className="tag2 t-win">WIN · 40%</span><span className="arrow">→</span><p>Your 0.005 NVDA is <b>auto-flushed into a permanently-locked LP pool</b> (paired with 50M $FINGERS). The team never touches wins. You also mint a Winner NFT worth staking.</p></div>
          <div className="mrow"><span className="tag2 t-lose">LOSE · 25%</span><span className="arrow">→</span><p><b>NFT stakers</b> — a live NVDA reward stream to everyone staking Winner NFTs. Losses literally pay the holders.</p></div>
          <div className="mrow"><span className="tag2 t-lose">LOSE · 75%</span><span className="arrow">→</span><p><b>Treasury sink</b> — an immutable address wired at launch; the owner can never redirect it.</p></div>
          <div className="mrow"><span className="tag2 t-house">SELL-BACK</span><span className="arrow">→</span><p>Won but changed your mind? <b>Burn a Winner for a 75% refund</b> (25% loss). The house keeps the 25%.</p></div>
        </div>
      </div>

      {/* NFT economy */}
      <div className="card glow">
        <div className="eyebrow">The asset</div>
        <h2>👑 The Winner NFT economy</h2>
        <div className="info-cards" style={{ marginTop: 6 }}>
          {NFT_CARDS.map((c, i) => (
            <div key={i} className="info-card">
              <h4>{c.k ? <><span className="k">{c.k}</span> {c.h2}</> : c.h}</h4>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tokenomics */}
      <div className="card glow">
        <div className="eyebrow">Tokenomics</div>
        <h2>$FINGERS — 100,000,000 fixed</h2>
        <p className="sub" style={{ marginBottom: 0 }}>One fixed mint at genesis. No hidden inflation, no team faucet — split in half by purpose.</p>
        <div className="split">
          <div className="lp">50M · LOCKED LIQUIDITY</div>
          <div className="emit">50M · STAKE EMISSION (90d)</div>
        </div>
        <p className="sub" style={{ fontSize: 13, marginBottom: 0 }}>A 1% buy/sell fee runs through a Uniswap-v4 hook → <b style={{ color: "var(--text)" }}>buyback + burn + staker rewards</b>. Liquidity is seeded into hooked, locked pools.</p>
      </div>

      {/* Trust */}
      <div className="card glow">
        <div className="eyebrow">The fine print that matters</div>
        <h2>🛡️ Trust &amp; safety</h2>
        <ul className="trust" style={{ marginTop: 8 }}>
          <li><b>Provably fair.</b> Outcomes derive from block hashes at commit time — no team edge, no re-rolls.</li>
          <li><b>Hard cap 1,000,000 Winners.</b> Past the cap, wins settle as losses. Supply of $FINGERS is fixed at 100M.</li>
          <li><b>No guaranteed-winner button.</b> Even free plays (giveaways / owner) are the same 40% gamble.</li>
          <li><b>Stake to earn.</b> The 50M $FINGERS is emitted to stakers over 90 days — not a fixed airdrop; unstaked emission goes to LP.</li>
          <li><b>Team custodies nothing.</b> Wins auto-flow into <b>permanently-locked LP</b>; the 50M $FINGERS is emitted to stakers; the team's only take is the 75%-of-losses sink. The 50M LP allocation is held by an immutable migrator, not a team wallet.</li>
          <li><b>Community-gated treasury.</b> The team <b>cannot</b> unilaterally drain the pooled NVDA — moving it needs an on-chain proposal that <b>50% of Winner NFTs vote to approve.</b></li>
        </ul>
        <div className="warn-box"><b>Not independently audited.</b> Written defensively, unit + live-fork tested (38/38) and verified on-chain — but a professional audit is still pending, and ownership moves to a multisig before launch. Play with what you can afford to lose. Nothing here is financial advice.</div>
      </div>
    </div>
  );
}
