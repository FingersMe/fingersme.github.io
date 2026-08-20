import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed } from "../lib/contracts";
import { useOwnedNfts, useStakedNfts } from "../lib/useOwnedNfts";

export function NftStakePanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");

  const deployed = isDeployed(addresses.nftStaking);
  const owned = useOwnedNfts(deployed ? addresses.winnerNFT : undefined);
  const stakedNfts = useStakedNfts(deployed ? addresses.winnerNFT : undefined, deployed ? addresses.nftStaking : undefined);

  const { data: staked } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "stakedCount", args: address ? [address] : undefined, query: { enabled: !!address && deployed, refetchInterval: 12_000 } });
  const { data: pend } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "pending", args: address ? [addresses.usdg, address] : undefined, query: { enabled: !!address && deployed, refetchInterval: 12_000 } });
  const { data: totalStaked } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "totalStaked", query: { enabled: deployed, refetchInterval: 15_000 } });

  const manualIds = manual.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean).map((x) => { try { return BigInt(x); } catch { return null; } }).filter((x): x is bigint => x !== null);

  async function stake(ids: bigint[]) {
    if (ids.length === 0) { toast.error("No winner NFTs to stake"); return; }
    try {
      setBusy(true);
      const approved = await publicClient!.readContract({ address: addresses.winnerNFT, abi: abi.winnerNFT, functionName: "isApprovedForAll", args: [address!, addresses.nftStaking] });
      if (!approved) { const h0 = await writeContractAsync({ address: addresses.winnerNFT, abi: abi.winnerNFT, functionName: "setApprovalForAll", args: [addresses.nftStaking, true] }); await publicClient!.waitForTransactionReceipt({ hash: h0 }); }
      const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "stake", args: [ids] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success(`Staked ${ids.length} winner${ids.length > 1 ? "s" : ""} 🔒`);
      owned.refresh(); stakedNfts.refresh(); setManual("");
    } catch (e: any) { toast.error(err(e)); } finally { setBusy(false); }
  }
  async function unstake(ids: bigint[]) {
    if (ids.length === 0) { toast.error("Nothing staked to withdraw"); return; }
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "unstake", args: [ids] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Unstaked"); owned.refresh(); stakedNfts.refresh();
    } catch (e: any) { toast.error(err(e)); } finally { setBusy(false); }
  }
  async function claim() {
    try { setBusy(true); const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "claim", args: [] }); await publicClient!.waitForTransactionReceipt({ hash }); toast.success("Claimed USDG rewards 💰"); }
    catch (e: any) { toast.error(err(e)); } finally { setBusy(false); }
  }

  if (!deployed) return <div className="card glow"><div className="notice">NFT staking isn't wired yet — set <span className="mono">VITE_ADDR_NFTSTAKING</span>.</div></div>;

  return (
    <div className="grid two">
      <div className="card glow">
        <h2>🔒 Stake your Winners</h2>
        <p className="sub">Staked Winners earn <b style={{ color: "var(--lime)" }}>25% of every loss</b> in USDG, split pro-rata by how many you stake. Claiming $FINGERS never burns them — keep them working.</p>
        <div className="statbar" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
          <div className="stat"><div className="k">Your staked</div><div className="v green">{staked !== undefined ? (staked as bigint).toString() : "—"}</div></div>
          <div className="stat"><div className="k">Pending USDG</div><div className="v gold">{pend !== undefined ? Number(formatUnits(pend as bigint, 6)).toFixed(2) : "—"}</div></div>
        </div>

        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn win" disabled={!isConnected || busy || owned.ids.length === 0} onClick={() => stake(owned.ids)}>
            {owned.loading ? "Scanning…" : `Stake all (${owned.ids.length})`}
          </button>
          <button className="btn alt" disabled={!isConnected || busy || stakedNfts.ids.length === 0} onClick={() => unstake(stakedNfts.ids)}>
            Unstake all ({stakedNfts.ids.length})
          </button>
          <button className="btn gold-btn" style={{ background: "linear-gradient(135deg,var(--gold),var(--gold-deep))", color: "#2a1c00" }} disabled={!isConnected || busy} onClick={claim}>Claim USDG</button>
        </div>
        {(owned.error || stakedNfts.error) && (
          <>
            <div className="hint">Auto-scan unavailable on this RPC — enter tokenIds manually:</div>
            <div className="row" style={{ marginTop: 6 }}>
              <input type="text" placeholder="12, 40, 128" value={manual} onChange={(e) => setManual(e.target.value)} />
              <button className="btn" disabled={busy} onClick={() => stake(manualIds)}>Stake</button>
              <button className="btn alt" disabled={busy} onClick={() => unstake(manualIds)}>Unstake</button>
            </div>
          </>
        )}
        {!owned.error && <div className="hint">You hold <b>{owned.ids.length}</b> unstaked Winner{owned.ids.length === 1 ? "" : "s"} · <b>{stakedNfts.ids.length}</b> staked. One click does it all — no tokenIds to copy.</div>}
      </div>

      <div className="card">
        <h2>🏆 Pool</h2>
        <p className="sub">Every losing bet pipes 25% of its USDG here. The more Winners staked, the thinner each slice — but volume keeps the sauce flowing.</p>
        <div className="stat" style={{ marginBottom: 12 }}><div className="k">Total Winners staked</div><div className="v green">{totalStaked !== undefined ? (totalStaked as bigint).toLocaleString() : "—"}</div></div>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          <img src="/won_NFT.png" alt="winners" style={{ width: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
}

function err(e: any) { return String(e?.shortMessage || e?.message || "Failed").slice(0, 120); }
