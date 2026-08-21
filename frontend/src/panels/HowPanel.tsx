import { motion } from "framer-motion";

const STEPS = [
  { n: "01", big: "🎰", h: "Pull the trigger", p: "Pay 1 NVDA per play (or swap ETH→NVDA in the app). Batch up to 50 rolls at once. Payment is taken up-front so nobody can peek at the result first." },
  { n: "02", big: "🎲", h: "Provably-fair roll", p: "The outcome is locked to the commit block's hash — a 40% chance to mint a Winner 👑, 60% a Loser badge 🌶️. Not you, not the team can grind it." },
  { n: "03", big: "👑", h: "Reveal your fate", p: "A block later, reveal. Winners get a real asset NFT; losers keep the saucy badge of shame forever. Anyone can settle a roll, so the game never stalls." },
  { n: "04", big: "💰", h: "Put winners to work", p: "Stake Winner NFTs to earn a live NVDA yield off every loss AND a share of the 50,000,000 $FINGERS 90-day emission — both split by how many you stake." },
];

export function HowPanel() {
  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card glow">
        <h2>🍗 How Fingers works</h2>
        <p className="sub">One crispy finger survived the fryer. Gamble to mint it, or wear the sauce. Everything below is enforced on-chain — read it once, play forever.</p>
        <div className="flow">
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

      <div className="card glow">
        <h2>⏳ A 30-day, round-based raise</h2>
        <p className="sub">Fingers isn't a fixed sale — it's a countdown. Whatever's raised by the buzzer (or when the team bonds the token) is the raise.</p>
        <div className="mflow">
          <div className="mrow"><span className="tag2 t-win">ROUNDS</span><span className="arrow">→</span><p>Starts at a <b>100-winner</b> tier and auto-escalates ×10 (round 1→2→3…) up to a hard <b>1,000,000</b> ceiling. The more it fills, the bigger it gets.</p></div>
          <div className="mrow"><span className="tag2 t-house">COUNTDOWN</span><span className="arrow">→</span><p>A <b>30-day clock</b> runs at the top. When it hits zero, new plays stop — reveals still settle. The team can extend it.</p></div>
          <div className="mrow"><span className="tag2 t-lose">BOND</span><span className="arrow">→</span><p>The team can <b>finalize anytime</b>: plays close, the 50M $FINGERS splits across whoever won, and the raised NVDA seeds locked liquidity.</p></div>
        </div>
      </div>

      <div className="card glow">
        <h2>💸 Where the money goes</h2>
        <p className="sub">Every play's NVDA is routed by outcome into separate on-chain buckets — the split can't be dodged.</p>
        <div className="mflow">
          <div className="mrow">
            <span className="tag2 t-win">WIN 40%</span><span className="arrow">→</span>
            <p>Your 1 NVDA is <b>retained by the game</b> to seed locked $FINGERS liquidity. You also get a Winner NFT worth staking + claiming.</p>
          </div>
          <div className="mrow">
            <span className="tag2 t-lose">LOSE · 25%</span><span className="arrow">→</span>
            <p><b>NFT stakers</b> — a live NVDA reward stream to everyone staking Winner NFTs. Losses literally pay the holders.</p>
          </div>
          <div className="mrow">
            <span className="tag2 t-lose">LOSE · 75%</span><span className="arrow">→</span>
            <p><b>Treasury sink</b> — an immutable address wired at launch; funds the ecosystem and buy pressure.</p>
          </div>
          <div className="mrow">
            <span className="tag2 t-house">SELL-BACK</span><span className="arrow">→</span>
            <p>Won but changed your mind? <b>Sell a Winner back for 75%</b> (a 25% loss). The NFT is burned; the house keeps the 25%.</p>
          </div>
        </div>
      </div>

      <div className="card glow">
        <h2>🛡️ Trust &amp; safety — read this</h2>
        <ul className="sub" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li><b>Provably fair:</b> outcomes come from block hashes at commit time — no team edge, no re-rolls.</li>
          <li><b>Hard cap:</b> at most <b>1,000,000</b> Winner NFTs ever. Past the cap, wins settle as losses.</li>
          <li><b>Free plays exist:</b> the team can gift free rolls (giveaways) and plays unlimited itself — but a free roll is still a 40% gamble. <b>There is no guaranteed-winner button.</b></li>
          <li><b>$FINGERS is fixed at 100,000,000</b> — 50M for liquidity, 50M claimable by winners. No hidden minting.</li>
          <li><b>Community-gated emergency:</b> the team <b>cannot</b> unilaterally drain the pooled NVDA. Moving it requires an on-chain proposal that <b>50% of Winner NFTs must vote to approve</b>. The legitimately-earned house margin (retained wins + treasury sink) is separate and always the team's.</li>
          <li><b>Not audited yet:</b> written defensively and unit + live-fork tested, but an independent professional audit is still pending. Play with money you can afford to lose.</li>
        </ul>
      </div>
    </div>
  );
}
