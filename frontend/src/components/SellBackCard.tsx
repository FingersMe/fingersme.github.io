import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed } from "../lib/contracts";
import { useOwnedNfts } from "../lib/useOwnedNfts";

const USDG_DECIMALS = 6;

export function SellBackCard() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<string>("");

  const deployed = isDeployed(addresses.game);
  const owned = useOwnedNfts(deployed ? addresses.winnerNFT : undefined);

  const { data: price } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "mintPrice", query: { enabled: deployed } });
  const refundEach = price ? ((price as bigint) * 7500n) / 10000n : undefined;

  async function sell(id: bigint) {
    try {
      setBusy(id.toString());
      const hash = await writeContractAsync({ address: addresses.game, abi: abi.game, functionName: "sellBackWinner", args: [id] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Sold back — 75% refunded 💸"); owned.refresh();
    } catch (e: any) {
      const m = String(e?.shortMessage || e?.message);
      toast.error(m.includes("not buyback-eligible") ? "Free wins can't be sold back" : m.includes("reserve low") ? "Buyback reserve is low right now" : m.slice(0, 120));
    } finally { setBusy(""); }
  }

  if (!deployed) return null;

  return (
    <div className="card glow">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <h2>💸 Sell a Winner back</h2>
        <span className="badge gold">{refundEach !== undefined ? `${Number(formatUnits(refundEach, USDG_DECIMALS))} USDG each` : "75% back"}</span>
      </div>
      <p className="sub">Changed your mind? Burn a Winner NFT for a <b>75% refund</b> (a 25% loss). Only paid wins qualify — staked NFTs must be unstaked first.</p>
      {!isConnected ? (
        <div className="notice">Connect your wallet to see your Winners.</div>
      ) : owned.loading ? (
        <div className="notice">Scanning your Winners…</div>
      ) : owned.ids.length === 0 ? (
        <div className="notice">No Winner NFTs in your wallet{owned.error ? " (auto-scan unavailable on this RPC)" : ""}.</div>
      ) : (
        <div className="row" style={{ gap: 8 }}>
          {owned.ids.map((id) => (
            <button key={id.toString()} className="btn red" disabled={!!busy} onClick={() => sell(id)}>
              {busy === id.toString() ? "…" : `Sell #${id.toString()}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
