import { Suspense, lazy } from "react";
import type { WidgetConfig } from "@lifi/widget";
import { addresses } from "../lib/contracts";

// LI.FI widget is heavy — lazy-load it so it never blocks first paint of the game.
const LiFiWidget = lazy(() =>
  import("@lifi/widget").then((m) => ({ default: m.LiFiWidget }))
);

const ROBINHOOD_CHAIN_ID = 4663;

const config: Partial<WidgetConfig> = {
  integrator: "fingers-me",
  // Land the user on Robinhood USDG — the token you play with.
  toChain: ROBINHOOD_CHAIN_ID,
  toToken: addresses.usdg,
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
        <h2>🔁 Bring funds in — swap to USDG</h2>
        <p className="sub">
          Play with whatever you already hold. Swap or bridge any asset from any chain straight into
          <b> USDG on Robinhood</b> (powered by LI.FI), then hop over to <b>Play</b>. Your wallet, your route —
          nothing is custodied here.
        </p>
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <Suspense fallback={<div className="card glow"><div className="notice">Loading the swap widget…</div></div>}>
          <LiFiWidget integrator="fingers-me" config={config} />
        </Suspense>
      </div>
    </div>
  );
}
