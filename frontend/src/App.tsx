import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { StatsBar } from "./components/StatsBar";
import { CountdownBar } from "./components/CountdownBar";
import { EmergencyBanner } from "./components/EmergencyBanner";
import { HowPanel } from "./panels/HowPanel";
import { MintPanel } from "./panels/MintPanel";
import { SwapPanel } from "./panels/SwapPanel";
import { GalleryPanel } from "./panels/GalleryPanel";
import { NftStakePanel } from "./panels/NftStakePanel";
import { ClaimPanel } from "./panels/ClaimPanel";
import { FingersPanel } from "./panels/FingersPanel";
import { AdminPanel } from "./panels/AdminPanel";
import { AnalyticsPanel } from "./panels/AnalyticsPanel";
import { IconHow, IconPlay, IconSwap, IconGallery, IconStake, IconClaim, IconCoin, IconAdmin, IconChart } from "./components/Icons";
import { robinhood } from "./lib/wagmi";
import { addresses, abi, isDeployed } from "./lib/contracts";

const TABS = [
  { id: "how", label: "How it works", Icon: IconHow },
  { id: "mint", label: "Play", Icon: IconPlay },
  { id: "swap", label: "Swap → USDG", Icon: IconSwap },
  { id: "gallery", label: "Gallery & sell-back", Icon: IconGallery },
  { id: "nftstake", label: "Stake NFTs", Icon: IconStake },
  { id: "claim", label: "Claim $FINGERS", Icon: IconClaim },
  { id: "fingers", label: "$FINGERS staking", Icon: IconCoin },
  { id: "analytics", label: "Analytics", Icon: IconChart },
] as const;
type TabId = (typeof TABS)[number]["id"] | "admin";

export default function App() {
  const [tab, setTab] = useState<TabId>("how");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongChain = isConnected && chainId !== robinhood.id;

  const { data: owner } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "owner", query: { enabled: isDeployed(addresses.game) } });
  const isOwner = !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();

  const activeLabel = tab === "admin" ? "admin" : TABS.find((t) => t.id === tab)?.id ?? "how";

  return (
    <div className="wrap">
      <div className="console">
        {/* ── Sidebar terminal ── */}
        <aside className="sidebar">
          <div className="term">
            <div className="term-bar">
              <span className="dot r" /><span className="dot y" /><span className="dot g" />
              <span className="title">fingers@robinhood: ~</span>
            </div>
            <div className="term-body">
              <div className="brand" style={{ marginBottom: 12 }}>
                <img className="float" src="/logo.png" alt="Fingers" />
                <div>
                  <div className="name">FINGERS</div>
                  <div className="tag"><b>Eat.</b> Win. <i>HODL.</i></div>
                </div>
              </div>
              <div className="prompt cursor" style={{ marginBottom: 14 }}>
                <b>$</b> ./play --odds 40/60 --price 1USDG
              </div>

              <nav className="nav">
                {TABS.map((t) => (
                  <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                    <t.Icon className="tico" /> {t.label}
                  </button>
                ))}
                {isOwner && (
                  <button className={`tab ${tab === "admin" ? "active" : ""}`} onClick={() => setTab("admin")} style={{ borderColor: "var(--gold)" }}>
                    <IconAdmin className="tico" /> Owner console
                  </button>
                )}
              </nav>
            </div>
          </div>

          <div className="term">
            <div className="term-body" style={{ display: "grid", gap: 10 }}>
              <span className="chain-chip" style={{ justifySelf: "start" }}>🪶 Robinhood Chain</span>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="content">
          <section className="hero" style={{ paddingTop: 6 }}>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <span className="c-lime">EAT.</span> <span className="c-gold">WIN.</span> <span className="c-pink">HODL.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              A provably-fair gamble-to-mint. Pay 1 USDG, pull the trigger: 40% mints a <b style={{ color: "var(--lime)" }}>Winner</b> you
              stake for real yield, 60% a saucy badge of shame. Won and want out? Sell it back for 75%.
            </motion.p>
            <div className="odds">
              <span className="pill win">40% WIN 👑</span>
              <span className="pill lose">60% LOSE 🌶️</span>
            </div>
          </section>

          {wrongChain && (
            <div className="notice pulse" style={{ marginBottom: 18, borderColor: "var(--orange)", color: "var(--orange)" }}>
              You're on the wrong network — switch to <b>Robinhood</b> (chainId {robinhood.id}) to play.
            </div>
          )}

          <EmergencyBanner />
          <CountdownBar />
          <StatsBar />

          <AnimatePresence mode="wait">
            <motion.div key={activeLabel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {tab === "how" && <HowPanel />}
              {tab === "mint" && <MintPanel />}
              {tab === "swap" && <SwapPanel />}
              {tab === "gallery" && <GalleryPanel />}
              {tab === "nftstake" && <NftStakePanel />}
              {tab === "claim" && <ClaimPanel />}
              {tab === "fingers" && <FingersPanel />}
              {tab === "analytics" && <AnalyticsPanel />}
              {tab === "admin" && isOwner && <AdminPanel />}
            </motion.div>
          </AnimatePresence>

          <div className="footer">
            Fingers Me runs on Robinhood Chain · commit-reveal fairness · community-gated treasury · not financial advice.
            <br />
            Winners: 1,000,000 max · loss splits 25% to NFT stakers / 75% to the treasury · $FINGERS 100M fixed · sell-back 75%.
          </div>
        </main>
      </div>
    </div>
  );
}
