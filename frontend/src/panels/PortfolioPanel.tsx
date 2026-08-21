import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletHoldings } from "../components/WalletHoldings";
import { NftStakePanel } from "./NftStakePanel";
import { ClaimPanel } from "./ClaimPanel";
import { FingersPanel } from "./FingersPanel";
import { GalleryPanel } from "./GalleryPanel";

type Sec = "earn" | "fingers" | "nfts";
const SECS: { id: Sec; label: string; icon: string }[] = [
  { id: "earn", label: "Stake & Claim", icon: "🏦" },
  { id: "fingers", label: "$FINGERS Staking", icon: "💎" },
  { id: "nfts", label: "My NFTs & Sell-back", icon: "🖼️" },
];

// One home for everything you own & earn: stake Winner NFTs for NVDA + $FINGERS, claim (or
// gamble) your emission, stake $FINGERS for fee share, and browse / sell-back your collection.
export function PortfolioPanel() {
  const [sec, setSec] = useState<Sec>("earn");

  return (
    <div className="grid" style={{ gap: 18 }}>
      <WalletHoldings />

      <div className="sub-tabs portfolio-tabs">
        {SECS.map((s) => (
          <button key={s.id} className={`sub-tab ${sec === s.id ? "on" : ""}`} onClick={() => setSec(s.id)}>
            <span style={{ marginRight: 6 }}>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={sec}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}>
          {sec === "earn" && (
            <div className="grid" style={{ gap: 18 }}>
              <NftStakePanel />
              <ClaimPanel />
            </div>
          )}
          {sec === "fingers" && <FingersPanel />}
          {sec === "nfts" && <GalleryPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
