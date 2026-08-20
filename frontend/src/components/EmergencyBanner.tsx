import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed } from "../lib/contracts";
import { useOwnedNfts, useStakedNfts } from "../lib/useOwnedNfts";

// emergency() tuple: [token, to, supplySnapshot, yesVotes, active, executed]
export function EmergencyBanner() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);

  const deployed = isDeployed(addresses.game);
  const { data: e, refetch } = useReadContract({
    address: addresses.game, abi: abi.game, functionName: "emergency",
    query: { enabled: deployed, refetchInterval: 12_000 },
  });

  const owned = useOwnedNfts(deployed ? addresses.winnerNFT : undefined);
  const staked = useStakedNfts(deployed ? addresses.winnerNFT : undefined, deployed ? addresses.nftStaking : undefined);

  if (!e) return null;
  const [, , supplySnapshot, yesVotes, active, executed] = e as unknown as [string, string, bigint, bigint, boolean, boolean];
  if (!active || executed) return null;

  const need = (supplySnapshot + 1n) / 2n; // ceil(50%)
  const pct = need > 0n ? Math.min(100, Number((yesVotes * 100n) / need)) : 0;
  const myIds = [...owned.ids, ...staked.ids];

  async function vote() {
    if (myIds.length === 0) { toast.error("You hold no Winner NFTs to vote with"); return; }
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.game, abi: abi.game, functionName: "voteEmergency", args: [myIds] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Voted 🗳️"); refetch();
    } catch (err: any) {
      const m = String(err?.shortMessage || err?.message);
      toast.error(m.includes("no new votes") ? "Your NFTs already voted" : m.slice(0, 120));
    } finally { setBusy(false); }
  }

  return (
    <div className="card glow pulse" style={{ marginBottom: 18, borderColor: "var(--orange)" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ color: "var(--orange)" }}>🚨 Emergency withdrawal vote is live</h2>
        <span className="badge gold">{yesVotes.toString()} / {need.toString()} votes</span>
      </div>
      <p className="sub" style={{ marginBottom: 12 }}>
        The team proposed moving the pooled USDG. It only goes through if <b>50% of Winner NFTs</b> approve.
        Your vote protects the treasury — one vote per Winner NFT you hold or have staked.
      </p>
      <div className="pbar" style={{ marginBottom: 12 }}><span style={{ width: `${pct}%` }} /></div>
      <button className="btn" disabled={!isConnected || busy || myIds.length === 0} onClick={vote}>
        {busy ? "Voting…" : myIds.length ? `🗳️ Vote with my ${myIds.length} Winner${myIds.length === 1 ? "" : "s"}` : "No Winner NFTs to vote"}
      </button>
    </div>
  );
}
