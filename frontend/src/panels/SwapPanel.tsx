import { Suspense, lazy } from "react";
import type { WidgetConfig } from "@lifi/widget";
import { addresses } from "../lib/contracts";

// LI.FI widget is heavy — lazy-load it so it never blocks first paint of the game.
const LiFiWidget = lazy(() =>
  import("@lifi/widget").then((m) => ({ default: m.LiFiWidget }))
);

const ROBINHOOD_CHAIN_ID = 4663;
const ROBINHOOD_WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73"; // routes WETH→NVDA on Robinhood (Nordstern)

const config: Partial<WidgetConfig> = {
  integrator: "fingers-me",
  // Land the user on Robinhood NVDA — the token you play with.
  toChain: ROBINHOOD_CHAIN_ID,
  toToken: addresses.usdg,
  // Start from a pair that actually has a live route so the widget resolves out of the box.
  // Users can still switch the source to any chain/token (Across etc. bridges into Robinhood).
  fromChain: ROBINHOOD_CHAIN_ID,
  fromToken: ROBINHOOD_WETH,
  appearance: "dark",
  theme: {
    palette: {
      primary: { main: "#ffc93c" },   // Fingers gold
      secondary: { main: "#b0f500" },  // Robinhood lime
      background: { paper: "#14110a", default: "#0c0a06" },
      text: { primary: "#f6efe0", secondary: "#a99e83" },
    },
    shape: { borderRadius: 14, borderRadiusSecondary: 10 },
    container: { border: "1px solid #2c2513", borderRadius: "16px" },
  },
};

export function SwapPanel() {
  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card glow">
        <h2>Bring funds in — swap to NVDA</h2>
        <p className="sub">
          Play with whatever you already hold. Swap or bridge any asset from any chain straight into
          <b> NVDA on Robinhood</b> (powered by LI.FI), then hop over to <b>Play</b>. Your wallet, your route —
          nothing is custodied here.
        </p>
        <div className="hint" style={{ marginTop: 0 }}>
          👉 <b>Connect your wallet inside the box below</b> (it has its own connect button) so it can find live routes.
          Seeing “no routes”? Try a bigger amount, or pick a source token you actually hold — thin pairs may have none.
        </div>
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <Suspense fallback={<div className="card glow"><div className="notice">Loading the swap widget…</div></div>}>
          <LiFiWidget integrator="fingers-me" config={config} />
        </Suspense>
      </div>
    </div>
  );
}
