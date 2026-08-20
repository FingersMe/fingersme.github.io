import { motion } from "framer-motion";

const STEPS = [
  { n: "01", big: "🎰", h: "Pull the trigger", p: "Pay 1 USDG per play (or swap ETH→USDG in the app). Batch up to 50 rolls at once. Payment is taken up-front so nobody can peek at the result first." },
  { n: "02", big: "🎲", h: "Provably-fair roll", p: "The outcome is locked to the commit block's hash — a 40% chance to mint a Winner 👑, 60% a Loser badge 🌶️. Not you, not the team can grind it." },
  { n: "03", big: "👑", h: "Reveal your fate", p: "A block later, reveal. Winners get a real asset NFT; losers keep the saucy badge of shame forever. Anyone can settle a roll, so the game never stalls." },
  { n: "04", big: "💰", h: "Put winners to work", p: "Stake Winner NFTs for a live USDG yield off every loss, claim your pro-rata slice of 50,000,000 $FINGERS, and boost your $FINGERS staking." },
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
        <h2>💸 Where the money goes</h2>
        <p className="sub">Every play's USDG is routed by outcome into separate on-chain buckets — the split can't be dodged.</p>
        <div className="mflow">
          <div className="mrow">
            <span className="tag2 t-win">WIN 40%</span><span className="arrow">→</span>
            <p>Your 1 USDG is <b>retained by the game</b> to seed locked $FINGERS liquidity. You also get a Winner NFT worth staking + claiming.</p>
          </div>
          <div className="mrow">
            <span className="tag2 t-lose">LOSE · 25%</span><span className="arrow">→</span>
            <p><b>NFT stakers</b> — a live USDG reward stream to everyone staking Winner NFTs. Losses literally pay the holders.</p>
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
          <li><b>Community-gated emergency:</b> the team <b>cannot</b> unilaterally drain the pooled USDG. Moving it requires an on-chain proposal that <b>50% of Winner NFTs must vote to approve</b>. The legitimately-earned house margin (retained wins + treasury sink) is separate and always the team's.</li>
          <li><b>Not audited yet:</b> written defensively and unit + live-fork tested, but an independent professional audit is still pending. Play with money you can afford to lose.</li>
        </ul>
      </div>
    </div>
  );
}
