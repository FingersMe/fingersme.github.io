import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed } from "../lib/contracts";
import { useOwnedNfts } from "../lib/useOwnedNfts";

export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");

  const deployed = isDeployed(addresses.claim);
  const owned = useOwnedNfts(deployed ? addresses.winnerNFT : undefined);

  const { data: opened } = useReadContract({ address: addresses.claim, abi: abi.claim, functionName: "opened", query: { enabled: deployed, refetchInterval: 15_000 } });
  const { data: share } = useReadContract({ address: addresses.claim, abi: abi.claim, functionName: "perNFTShare", query: { enabled: deployed } });
  const { data: winnerLock } = useReadContract({ address: addresses.claim, abi: abi.claim, functionName: "winnerLockCount", query: { enabled: deployed } });

  const manualIds = manual.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean).map((x) => { try { return BigInt(x); } catch { return null; } }).filter((x): x is bigint => x !== null);
  const perShareHuman = share ? Number(formatUnits(share as bigint, 18)).toLocaleString() : "—";
  const estimate = share && owned.ids.length ? Number(formatUnits((share as bigint) * BigInt(owned.ids.length), 18)).toLocaleString() : "0";

  async function claim(ids: bigint[]) {
    if (ids.length === 0) { toast.error("No winner NFTs to claim"); return; }
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.claim, abi: abi.claim, functionName: "claimMany", args: [ids] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Claimed $FINGERS 🎁"); owned.refresh(); setManual("");
    } catch (e: any) { toast.error(String(e?.shortMessage || e?.message).slice(0, 120)); } finally { setBusy(false); }
  }

  if (!deployed) return <div className="card glow"><div className="notice">Claim isn't wired yet — set <span className="mono">VITE_ADDR_CLAIM</span>.</div></div>;

  return (
    <div className="card glow" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>🎁 Claim your $FINGERS</h2>
      <p className="sub">50,000,000 $FINGERS split evenly across every Winner NFT — more wins, more tokens. Claiming does <b>not</b> burn your NFT, so keep it staked.</p>

      <div className="statbar" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="stat"><div className="k">Status</div><div className="v green">{opened ? "OPEN" : "Soon"}</div></div>
        <div className="stat"><div className="k">Per Winner</div><div className="v gold">{perShareHuman}</div></div>
        <div className="stat"><div className="k">You can claim</div><div className="v">{owned.loading ? <span className="skel">00</span> : `${estimate}`}</div></div>
      </div>

      {!opened ? (
        <div className="notice" style={{ marginTop: 16 }}>Claiming opens once Round 1 closes and every play is settled ({winnerLock !== undefined ? (winnerLock as bigint).toString() : "?"} Winners locked). Check back after the round.</div>
      ) : (
        <>
          <button className="btn full" style={{ marginTop: 16 }} disabled={!isConnected || busy || owned.ids.length === 0} onClick={() => claim(owned.ids)}>
            {busy ? "Claiming…" : owned.loading ? "Scanning your Winners…" : `Claim all ${owned.ids.length} Winner${owned.ids.length === 1 ? "" : "s"} → ${estimate} $FINGERS`}
          </button>
          {owned.error && (
            <div style={{ marginTop: 12 }}>
              <div className="hint">Auto-scan unavailable on this RPC — enter tokenIds manually:</div>
              <div className="row" style={{ marginTop: 6 }}>
                <input type="text" placeholder="3, 17, 22" value={manual} onChange={(e) => setManual(e.target.value)} />
                <button className="btn" disabled={busy} onClick={() => claim(manualIds)}>Claim</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
