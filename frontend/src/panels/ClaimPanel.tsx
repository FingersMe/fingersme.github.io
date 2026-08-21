import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed } from "../lib/contracts";

const fmtF = (v?: bigint) => v === undefined ? "—" : Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 });

// fingersEmissionInfo() → [ratePerSec, endsAt, secsLeft, recognized, total]
export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t); }, []);

  const on = isDeployed(addresses.nftStaking);
  const { data: info } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "fingersEmissionInfo", query: { enabled: on, refetchInterval: 15_000 } });
  const { data: pend, refetch: refetchPend } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "pendingFingers", args: address ? [address] : undefined, query: { enabled: on && !!address, refetchInterval: 10_000 } });
  const { data: staked } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "stakedCount", args: address ? [address] : undefined, query: { enabled: on && !!address, refetchInterval: 15_000 } });

  if (!on) return <div className="card glow"><div className="notice">Staking isn't wired yet.</div></div>;

  const r = info as unknown as [bigint, bigint, bigint, bigint, bigint] | undefined;
  const rate = r?.[0] ?? 0n, recognized = r?.[3] ?? 0n, total = r?.[4] ?? 50_000_000n * 10n ** 18n;
  const started = rate > 0n;
  const secsLeft = started ? Number(r?.[2] ?? 0n) : 0; // on-chain seconds left (chain-clock accurate)
  const days = Math.floor(secsLeft / 86400), hrs = Math.floor((secsLeft % 86400) / 3600);
  const pct = total > 0n ? Math.min(100, Number((recognized * 100n) / total)) : 0;
  const myStaked = (staked as bigint | undefined) ?? 0n;

  async function claim() {
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "claim", args: [] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Claimed $FINGERS 🎁"); refetchPend();
    } catch (e: any) { toast.error(String(e?.shortMessage || e?.message).slice(0, 120)); } finally { setBusy(false); }
  }

  return (
    <div className="grid" style={{ gap: 18, maxWidth: 720, margin: "0 auto" }}>
      <div className="card glow">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h2>🎁 Earn $FINGERS by staking</h2>
          <span className={`badge ${started ? "win" : "gold"}`}>{started ? `${days}d ${hrs}h left` : "starts after finalize"}</span>
        </div>
        <p className="sub">
          <b>50,000,000 $FINGERS</b> streams to <b>Winner-NFT stakers</b> over <b>90 days</b> — split by how many NFTs you stake, so your share
          dilutes as more people join. No fixed claim: stake to earn, claim anytime. Unstaked emission goes to locked liquidity.
        </p>
        <div className="statbar" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="stat"><div className="k">Emitted so far</div><div className="v gold">{fmtF(recognized)}</div></div>
          <div className="stat"><div className="k">Your staked NFTs</div><div className="v green">{myStaked.toString()}</div></div>
          <div className="stat"><div className="k">Your claimable</div><div className="v">{fmtF(pend as bigint | undefined)}</div></div>
        </div>
        <div className="hint" style={{ marginTop: 4 }}>{fmtF(recognized)} / {fmtF(total)} $FINGERS emitted</div>
        <div className="pbar" style={{ marginTop: 6 }}><span style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="card glow">
        {myStaked === 0n ? (
          <div className="notice">You have <b>0 Winner NFTs staked</b> — head to <b>Stake NFTs</b> and stake to start earning $FINGERS + NVDA.</div>
        ) : (
          <button className="btn full win" disabled={!isConnected || busy || ((pend as bigint | undefined) ?? 0n) === 0n} onClick={claim}>
            {busy ? "Claiming…" : `🎁 Claim ${fmtF(pend as bigint | undefined)} $FINGERS`}
          </button>
        )}
        <div className="hint" style={{ marginTop: 10 }}>Claiming here also sweeps any pending NVDA staking rewards in the same tx.</div>
      </div>
    </div>
  );
}
