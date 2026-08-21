import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type GamblePhase = "confirm" | "flipping" | "won" | "lost";
export type GambleState = { phase: GamblePhase; amount: string; payout?: string; jackpot?: string } | null;

// Our own on-brand double-or-nothing pop-up: confirm → coin flip → WON 2× / LOST-to-jackpot.
// Replaces the native confirm() + toast so the whole gamble reads as one crafted moment.
export function GambleModal({ state, onConfirm, onClose }: { state: GambleState; onConfirm: () => void; onClose: () => void }) {
  const phase = state?.phase;
  const dismissable = phase === "confirm" || phase === "won" || phase === "lost";

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissable && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, dismissable, onClose]);

  return (
    <AnimatePresence>
      {state && (
        <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => dismissable && onClose()}>
          {phase === "won" && <Confetti />}
          <motion.div className={`modal gamble-modal ${phase === "won" ? "win" : phase === "lost" ? "lose" : ""}`}
            initial={{ scale: 0.85, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}>

            <Coin phase={phase!} />

            {phase === "confirm" && (
              <>
                <h2 className="modal-title">🎲 Double or nothing</h2>
                <p className="modal-sub">
                  You're flipping <b className="up">{state.amount} $FINGERS</b> on a provably-fair coin.
                </p>
                <div className="gm-odds">
                  <div className="gm-odd win"><span className="gm-k">HEADS · 50%</span><span className="gm-v">Win up to <b>2×</b></span><span className="gm-s">≈ {state.payout} $FINGERS</span></div>
                  <div className="gm-odd lose"><span className="gm-k">TAILS · 50%</span><span className="gm-v">Feeds the <b>jackpot</b></span><span className="gm-s">for the next winner</span></div>
                </div>
                <p className="gm-fine">Your NVDA yield is never at risk — only the $FINGERS rides. No burns, supply-neutral.</p>
                <div className="row" style={{ gap: 10 }}>
                  <button className="btn alt" style={{ flex: 1 }} onClick={onClose}>Keep it safe</button>
                  <button className="btn win" style={{ flex: 1.4 }} onClick={onConfirm}>🎲 Flip it</button>
                </div>
              </>
            )}

            {phase === "flipping" && (
              <>
                <h2 className="modal-title">Flipping…</h2>
                <p className="modal-sub">Locking your bet to the block hash. Confirm the reveal in your wallet 👀</p>
              </>
            )}

            {phase === "won" && (
              <>
                <h2 className="modal-title" style={{ color: "var(--lime)" }}>👑 DOUBLE!</h2>
                <p className="modal-sub">The coin landed your way — <b className="up">{state.payout} $FINGERS</b> just hit your wallet.</p>
                <button className="btn full win" onClick={onClose}>LET'S GO 🔥</button>
              </>
            )}

            {phase === "lost" && (
              <>
                <h2 className="modal-title" style={{ color: "var(--pink)" }}>🌶️ Tails!</h2>
                <p className="modal-sub">Your <b>{state.amount} $FINGERS</b> dropped into the jackpot for the next winner. No burn — it's still in play.</p>
                <button className="btn full pink" onClick={onClose}>Run it back 🎲</button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Coin({ phase }: { phase: GamblePhase }) {
  const face = phase === "won" ? "👑" : phase === "lost" ? "🌶️" : "🎲";
  const spin = phase === "flipping";
  return (
    <motion.div className="gm-coin" aria-hidden
      animate={spin ? { rotateY: [0, 1800] } : { rotateY: 0 }}
      transition={spin ? { duration: 1.1, repeat: Infinity, ease: "linear" } : { type: "spring", stiffness: 200 }}>
      <span>{face}</span>
    </motion.div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 70 });
  const colors = ["#2fe6a0", "#16c784", "#ea4b5b", "#2fe6a0", "#ffffff"];
  return (
    <div className="confetti" aria-hidden>
      {bits.map((_, i) => {
        const left = (i * 137.5) % 100;
        const delay = (i % 10) * 0.12;
        const dur = 2.2 + (i % 7) * 0.25;
        const c = colors[i % colors.length];
        const size = 6 + (i % 4) * 2;
        return <span key={i} style={{ left: `${left}%`, background: c, width: size, height: size * 1.6, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />;
      })}
    </div>
  );
}
