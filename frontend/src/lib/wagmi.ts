import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Robinhood Chain (chainId 4663) — the L2 the Fingers Me contracts live on.
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});

// WalletConnect (Reown) projectId — get one free at https://cloud.reown.com and put it in
// frontend/.env as VITE_WC_PROJECT_ID. A placeholder still renders the injected/browser wallet.
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? "0299d75f727f4ded571ce094407cf023";

export const wagmiConfig = getDefaultConfig({
  appName: "Fingers Me",
  projectId,
  chains: [robinhood],
  ssr: false,
});
