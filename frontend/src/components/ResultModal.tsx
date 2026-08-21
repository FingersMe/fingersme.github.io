import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Res = { id: bigint; won: boolean; nftId: bigint };

export function ResultModal({ results, onClose }: { results: Res[] | null; onClose: () => void }) {
  const wins = results?.filter((r) => r.won).length ?? 0;
  const losses = results?.filter((r) => !r.won).length ?? 0;
  const anyWin = wins > 0;

  useEffect(() => {
    if (!results) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, onClose]);

  return (
    <AnimatePresence>
      {results && (
        <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          {anyWin && <Confetti />}
          <motion.div
            className={`modal ${anyWin ? "win" : "lose"}`}
            initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-art" style={{ borderColor: anyWin ? "rgba(155,232,15,.6)" : "rgba(255,46,139,.6)", boxShadow: `0 0 40px ${anyWin ? "rgba(155,232,15,.35)" : "rgba(255,46,139,.3)"}` }}>
              <img src={anyWin ? "/won_NFT.png" : "/loses_NFT.png"} alt={anyWin ? "Winner" : "Loser"} />
            </div>
            <h2 className="modal-title" style={{ color: anyWin ? "var(--lime)" : "var(--pink)" }}>
              {anyWin ? "👑 YOU WON!" : "🌶️ REKT!"}
            </h2>
            <p className="modal-sub">
              {anyWin
                ? `You minted ${wins} Winner NFT${wins > 1 ? "s" : ""}${losses ? ` (and ${losses} saucy badge${losses > 1 ? "s" : ""})` : ""}. Stake it for USDG yield + claim your $FINGERS.`
                : `${losses} badge${losses > 1 ? "s" : ""} of shame minted. Eat. Lose. Cry. Try again — the fryer is merciless.`}
            </p>
            <div className="row" style={{ gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
              {results.slice(0, 30).map((r) => (
                <span key={r.id.toString()} className={`badge ${r.won ? "win" : "lose"}`}>{r.won ? `WIN #${r.nftId}` : "LOSE"}</span>
              ))}
            </div>
            <button className={`btn full ${anyWin ? "win" : "pink"}`} onClick={onClose}>{anyWin ? "LET'S GO 🔥" : "Run it back 🎲"}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Confetti() {
  const bits = Array.from({ length: 70 });
  const colors = ["#b0f500", "#ffc93c", "#ff2e8b", "#f5a623", "#ffffff"];
  return (
    <div className="confetti" aria-hidden>
      {bits.map((_, i) => {
        const left = (i * 137.5) % 100;                 // golden-angle spread (deterministic)
        const delay = (i % 10) * 0.12;
        const dur = 2.2 + (i % 7) * 0.25;
        const c = colors[i % colors.length];
        const size = 6 + (i % 4) * 2;
        return <span key={i} style={{ left: `${left}%`, background: c, width: size, height: size * 1.6, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />;
      })}
    </div>
  );
}
