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
  // Land the user on Robinhood NVDA — the token you play with. Default from a pair with a live route.
  toChain: ROBINHOOD_CHAIN_ID,
  toToken: addresses.usdg,        // NVDA
  fromChain: ROBINHOOD_CHAIN_ID,
  fromToken: ROBINHOOD_WETH,      // WETH → NVDA routes via Nordstern (verified)
  appearance: "dark",
  theme: {
    palette: {
      primary: { main: "#16c784" },
      secondary: { main: "#2fe6a0" },
      background: { paper: "#0b1114", default: "#05080a" },
      text: { primary: "#eef4f2", secondary: "#7f948d" },
      grey: { 300: "#1b2a2f", 700: "#1b2a2f", 800: "#0b1114" },
    },
    shape: { borderRadius: 14, borderRadiusSecondary: 10 },
    container: { border: "1px solid #1b2a2f", borderRadius: "16px" },
  },
};

export function SwapPanel() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card glow">
        <div className="an-head"><h2>Bring funds in — swap to NVDA</h2><span className="badge win">via LI.FI</span></div>
        <p className="sub" style={{ marginBottom: 12 }}>
          Play with whatever you already hold. Swap or bridge any asset — ETH, USDC, stables, any chain — straight into
          <b className="up"> NVDA on Robinhood</b>, then hop to <b>Play</b>. Non-custodial: your wallet, your route.
        </p>
        <div className="mflow">
          <div className="mrow"><span className="tag2 t-win">STEP 1</span><span className="arrow">→</span><p><b>Connect inside the widget below</b> (it has its own connect) so it can fetch live routes.</p></div>
          <div className="mrow"><span className="tag2 t-win">STEP 2</span><span className="arrow">→</span><p>Pick a token you actually hold (WETH → NVDA works out of the box; ETH/USDC bridge in too), enter an amount, execute.</p></div>
          <div className="mrow"><span className="tag2 t-house">HEADS UP</span><span className="arrow">→</span><p>“No routes” usually means the source token isn’t connected/held or the amount is too small — try a bigger amount or a token in your wallet.</p></div>
        </div>
      </div>
      <div className="swap-wrap">
        <Suspense fallback={<div className="card glow"><div className="notice">Loading the swap widget…</div></div>}>
          <LiFiWidget integrator="fingers-me" config={config} />
        </Suspense>
      </div>
    </div>
  );
}
