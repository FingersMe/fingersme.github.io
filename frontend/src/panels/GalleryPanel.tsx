import { useReadContract } from "wagmi";
import { motion } from "framer-motion";
import { addresses, abi, isDeployed } from "../lib/contracts";
import { WalletHoldings } from "../components/WalletHoldings";
import { SellBackCard } from "../components/SellBackCard";

export function GalleryPanel() {
  const deployed = isDeployed(addresses.winnerNFT);
  const { data: winners, isLoading: lw } = useReadContract({ address: addresses.winnerNFT, abi: abi.winnerNFT, functionName: "totalSupply", query: { enabled: deployed, refetchInterval: 15_000 } });
  const { data: losers, isLoading: ll } = useReadContract({ address: addresses.loserNFT, abi: abi.loserNFT, functionName: "totalSupply", query: { enabled: deployed, refetchInterval: 15_000 } });

  return (
    <div className="grid" style={{ gap: 18 }}>
      <WalletHoldings />
      <div className="grid two">
        <Collection art="/won_NFT.png" title="Winners" emoji="👑" tone="win"
          count={deployed ? (winners as bigint | undefined) : undefined} loading={deployed && lw}
          blurb="Crowned & crispy. A Winner is a real asset — stake it for a share of every loss in USDG, boost your $FINGERS yield, and claim your slice of 50,000,000 $FINGERS." />
        <Collection art="/loses_NFT.png" title="Losers" emoji="🌶️" tone="lose"
          count={deployed ? (losers as bigint | undefined) : undefined} loading={deployed && ll}
          blurb="REKT and saucy. The badge of shame lives in your wallet forever — Eat. Lose. Cry. No powers, all flavor (burn it yourself if the pain's too real)." />
      </div>
      <SellBackCard />
    </div>
  );
}

function Collection({ art, title, emoji, tone, count, loading, blurb }: {
  art: string; title: string; emoji: string; tone: "win" | "lose"; count?: bigint; loading?: boolean; blurb: string;
}) {
  const ring = tone === "win" ? "rgba(176,245,0,.5)" : "rgba(255,46,139,.5)";
  return (
    <motion.div className="card glow" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h2>{emoji} {title}</h2>
        <span className={`badge ${tone}`}>{loading ? <span className="skel">000</span> : count !== undefined ? `${count.toLocaleString()} minted` : "— minted"}</span>
      </div>
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${ring}`, boxShadow: `0 0 26px ${ring}`, aspectRatio: "16 / 10", background: "#05010a" }}>
        <img src={art} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>{blurb}</p>
    </motion.div>
  );
}
