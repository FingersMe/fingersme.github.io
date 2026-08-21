import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { addresses, abi, erc20Abi, isDeployed } from "../lib/contracts";

export function WalletHoldings() {
  const { address, isConnected } = useAccount();
  const deployed = isDeployed(addresses.winnerNFT);
  const on = { enabled: !!address && deployed, refetchInterval: 12_000 } as const;

  const { data: wins } = useReadContract({ address: addresses.winnerNFT, abi: abi.winnerNFT, functionName: "balanceOf", args: address ? [address] : undefined, query: on });
  const { data: losses } = useReadContract({ address: addresses.loserNFT, abi: abi.loserNFT, functionName: "balanceOf", args: address ? [address] : undefined, query: on });
  const { data: staked } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "stakedCount", args: address ? [address] : undefined, query: on });
  const { data: fing } = useReadContract({ address: addresses.token, abi: erc20Abi, functionName: "balanceOf", args: address ? [address] : undefined, query: on });

  if (!isConnected) {
    return <div className="card"><div className="notice">Connect your wallet to see your Fingers, badges and $FINGERS.</div></div>;
  }

  return (
    <div className="card glow">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h2>👛 My Wallet</h2>
        <span className="badge gold mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Holding art="/won_NFT.png" label="Winners" tone="win" value={num(wins)} deployed={deployed} />
        <Holding art="/loses_NFT.png" label="Losers" tone="lose" value={num(losses)} deployed={deployed} />
        <Holding art="/NFT_Logo.png" label="Staked NFTs" tone="win" value={num(staked)} deployed={deployed} />
        <Holding art="/logo.png" label="$FINGERS" tone="gold" value={fing !== undefined ? Number(formatUnits(fing as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : deployed ? undefined : "—"} deployed={deployed} />
      </div>
    </div>
  );
}

function num(v: unknown): string | undefined { return v !== undefined ? (v as bigint).toString() : undefined; }

function Holding({ art, label, value, tone, deployed }: { art: string; label: string; value?: string; tone: "win" | "lose" | "gold"; deployed: boolean }) {
  const ring = tone === "win" ? "rgba(47,230,160,.4)" : tone === "lose" ? "rgba(234,75,91,.4)" : "rgba(22,199,132,.4)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", flex: "0 0 auto", border: `1px solid ${ring}`, boxShadow: `0 0 14px ${ring}` }}>
        <img src={art} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div>
        <div className="k" style={{ color: "var(--muted)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>{value ?? (deployed ? <span className="skel">00</span> : "—")}</div>
      </div>
    </div>
  );
}
