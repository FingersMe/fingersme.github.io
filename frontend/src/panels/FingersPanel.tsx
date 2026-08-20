import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, erc20Abi, isDeployed } from "../lib/contracts";

export function FingersPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);

  const deployed = isDeployed(addresses.fingersStaking);
  const { data: bal } = useReadContract({ address: addresses.token, abi: erc20Abi, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address && deployed, refetchInterval: 12_000 } });
  const { data: info } = useReadContract({ address: addresses.fingersStaking, abi: abi.fingersStaking, functionName: "userInfo", args: address ? [address] : undefined, query: { enabled: !!address && deployed, refetchInterval: 12_000 } });
  const { data: pend } = useReadContract({ address: addresses.fingersStaking, abi: abi.fingersStaking, functionName: "pending", args: address ? [address] : undefined, query: { enabled: !!address && deployed, refetchInterval: 12_000 } });
  const { data: boost } = useReadContract({ address: addresses.fingersStaking, abi: abi.fingersStaking, functionName: "boostBPOf", args: address ? [address] : undefined, query: { enabled: !!address && deployed } });

  const stakedAmt = info ? (info as any)[0] as bigint : 0n;
  const boostPct = boost ? Number(boost as bigint) / 100 : 0;

  async function act(kind: "stake" | "unstake" | "claim" | "sync") {
    try {
      setBusy(true);
      if (kind === "claim") { const h = await writeContractAsync({ address: addresses.fingersStaking, abi: abi.fingersStaking, functionName: "claim", args: [] }); await publicClient!.waitForTransactionReceipt({ hash: h }); toast.success("Claimed $FINGERS"); return; }
      if (kind === "sync") { const h = await writeContractAsync({ address: addresses.fingersStaking, abi: abi.fingersStaking, functionName: "syncBoost", args: [] }); await publicClient!.waitForTransactionReceipt({ hash: h }); toast.success("Boost refreshed"); return; }
      const wei = parseUnits(amt || "0", 18);
      if (wei <= 0n) { toast.error("Enter an amount"); return; }
      if (kind === "stake") {
        const allow = await publicClient!.readContract({ address: addresses.token, abi: erc20Abi, functionName: "allowance", args: [address!, addresses.fingersStaking] }) as bigint;
        if (allow < wei) { const h0 = await writeContractAsync({ address: addresses.token, abi: erc20Abi, functionName: "approve", args: [addresses.fingersStaking, maxUint256] }); await publicClient!.waitForTransactionReceipt({ hash: h0 }); }
      }
      const h = await writeContractAsync({ address: addresses.fingersStaking, abi: abi.fingersStaking, functionName: kind, args: [wei] });
      await publicClient!.waitForTransactionReceipt({ hash: h });
      toast.success(kind === "stake" ? "Staked $FINGERS" : "Unstaked");
      setAmt("");
    } catch (e: any) { toast.error(String(e?.shortMessage || e?.message).slice(0, 120)); } finally { setBusy(false); }
  }

  if (!deployed) return <div className="card glow"><div className="notice">$FINGERS staking isn't wired yet — set <span className="mono">VITE_ADDR_FSTAKING</span> and <span className="mono">VITE_ADDR_TOKEN</span>.</div></div>;

  return (
    <div className="grid two">
      <div className="card glow">
        <h2>💎 Stake $FINGERS</h2>
        <p className="sub">Earn a cut of every 1% swap fee, in $FINGERS. Your yield is <b>boosted by the Winner NFTs you stake</b> — stake NFTs, then hit “Refresh boost”.</p>
        <div className="statbar" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 14 }}>
          <div className="stat"><div className="k">Staked</div><div className="v green">{Number(formatUnits(stakedAmt, 18)).toLocaleString()}</div></div>
          <div className="stat"><div className="k">NFT boost</div><div className="v">+{boostPct.toFixed(0)}%</div></div>
        </div>
        <label className="hint" style={{ display: "block", marginBottom: 6 }}>Amount</label>
        <input type="number" placeholder="0.0" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" disabled={!isConnected || busy} onClick={() => act("stake")}>Stake</button>
          <button className="btn alt" disabled={!isConnected || busy} onClick={() => act("unstake")}>Unstake</button>
        </div>
        <div className="hint">Wallet: <span className="mono">{bal !== undefined ? Number(formatUnits(bal as bigint, 18)).toLocaleString() : "—"} FINGERS</span></div>
      </div>

      <div className="card">
        <h2>Rewards</h2>
        <p className="sub">Fees flow in continuously from trading. Claim any time; a short loyalty hold keeps dumpers from draining stakers.</p>
        <div className="stat" style={{ marginBottom: 14 }}><div className="k">Pending $FINGERS</div><div className="v green">{pend !== undefined ? Number(formatUnits(pend as bigint, 18)).toFixed(4) : "—"}</div></div>
        <div className="row">
          <button className="btn orange" disabled={!isConnected || busy} onClick={() => act("claim")}>Claim</button>
          <button className="btn alt" disabled={!isConnected || busy} onClick={() => act("sync")}>Refresh boost</button>
        </div>
      </div>
    </div>
  );
}
