import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";
import { wagmiConfig } from "./lib/wagmi";
import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00ff88",
            accentColorForeground: "#04140c",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
        >
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#0b1018", color: "#eaf0f7", border: "1px solid #1e2a3a", fontSize: 14 },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
