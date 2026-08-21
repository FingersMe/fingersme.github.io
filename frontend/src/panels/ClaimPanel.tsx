import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits, decodeEventLog } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed, fmtPay } from "../lib/contracts";
import { usePrices, usd } from "../lib/usePrices";

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
  const { data: jackpot } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "fingersJackpot", query: { enabled: on, refetchInterval: 12_000 } });
  const { data: pg, refetch: refetchPg } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "pendingGamble", args: address ? [address] : undefined, query: { enabled: on && !!address, refetchInterval: 5_000 } });
  const { data: pendNvda, refetch: refetchNvda } = useReadContract({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "pending", args: address ? [addresses.usdg, address] : undefined, query: { enabled: on && !!address, refetchInterval: 10_000 } });
  const { nvdaUsd, fingersUsd } = usePrices();

  if (!on) return <div className="card glow"><div className="notice">Staking isn't wired yet.</div></div>;

  const r = info as unknown as [bigint, bigint, bigint, bigint, bigint] | undefined;
  const rate = r?.[0] ?? 0n, recognized = r?.[3] ?? 0n, total = r?.[4] ?? 50_000_000n * 10n ** 18n;
  const started = rate > 0n;
  const secsLeft = started ? Number(r?.[2] ?? 0n) : 0; // on-chain seconds left (chain-clock accurate)
  const days = Math.floor(secsLeft / 86400), hrs = Math.floor((secsLeft % 86400) / 3600);
  const pct = total > 0n ? Math.min(100, Number((recognized * 100n) / total)) : 0;
  const myStaked = (staked as bigint | undefined) ?? 0n;
  const claimable = (pend as bigint | undefined) ?? 0n;
  const nvdaOwed = (pendNvda as bigint | undefined) ?? 0n;
  const pgt = pg as readonly [bigint, bigint, boolean] | undefined;
  const gambleAmt = pgt?.[0] ?? 0n;
  const gambleRevealable = pgt?.[2] ?? false;
  const fUsd = (v: bigint) => fingersUsd > 0 ? usd(Number(formatUnits(v, 18)) * fingersUsd) : null;
  const nUsd = (v: bigint) => usd(Number(formatUnits(v, 18)) * nvdaUsd);

  async function claim() {
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "claim", args: [] });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Claimed NVDA + $FINGERS 🎁"); refetchPend(); refetchNvda();
    } catch (e: any) { toast.error(String(e?.shortMessage || e?.message).slice(0, 120)); } finally { setBusy(false); }
  }

  // Reveal a live/committed gamble; returns true if it resolved.
  async function reveal() {
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "gambleClaimReveal", args: [] });
      const rc = await publicClient!.waitForTransactionReceipt({ hash });
      let won = false, payout = 0n;
      for (const log of rc.logs) {
        try { const ev = decodeEventLog({ abi: abi.nftStaking, data: log.data, topics: log.topics });
          if (ev.eventName === "GambleRevealed") { won = (ev.args as any).won; payout = (ev.args as any).payout as bigint; } } catch {}
      }
      if (won) toast.success(`🎉 DOUBLE! You won ${fmtF(payout)} $FINGERS!`, { duration: 6000 });
      else toast("💀 Nothing this time — your stake fed the jackpot.", { icon: "🎲", duration: 6000 });
      refetchPend(); refetchPg();
    } catch (e: any) { toast.error(String(e?.shortMessage || e?.message).slice(0, 120)); } finally { setBusy(false); }
  }

  // Commit the claim to a 50/50, then auto-reveal a block later.
  async function gamble() {
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.nftStaking, abi: abi.nftStaking, functionName: "gambleClaimCommit", args: [] });
      const rc = await publicClient!.waitForTransactionReceipt({ hash });
      toast("🎲 Bet placed — revealing your flip…", { icon: "🎲" });
      refetchPg();
      // wait for the next block, then reveal
      for (let i = 0; i < 20; i++) { const bn = await publicClient!.getBlockNumber(); if (bn > rc.blockNumber) break; await new Promise((r) => setTimeout(r, 1500)); }
      await reveal();
    } catch (e: any) { toast.error(String(e?.shortMessage || e?.message).slice(0, 120)); setBusy(false); }
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
        ) : gambleAmt > 0n ? (
          <>
            <div className="notice pulse" style={{ marginBottom: 12, borderColor: "var(--green)", color: "var(--green)" }}>
              🎲 Bet placed: <b>{fmtF(gambleAmt)} $FINGERS</b> riding on the flip. {gambleRevealable ? "Reveal it now!" : "Waiting for the next block…"}
            </div>
            <button className="btn full win" disabled={busy || !gambleRevealable} onClick={reveal}>{busy ? "Revealing…" : "🎲 Reveal my flip"}</button>
          </>
        ) : (
          <>
            <div className="claim-lines">
              <div className="claim-line">
                <span className="cl-tok"><img src="/logox.png" alt="" /> NVDA yield</span>
                <span className="cl-amt">{fmtPay(nvdaOwed)}<i>{nUsd(nvdaOwed)}</i></span>
              </div>
              <div className="claim-line">
                <span className="cl-tok"><img src="/logo.png" alt="" /> $FINGERS emission</span>
                <span className="cl-amt">{fmtF(claimable)}<i>{fUsd(claimable) ?? "pre-LP"}</i></span>
              </div>
            </div>

            <button className="btn full win" style={{ marginTop: 4 }} disabled={!isConnected || busy || (claimable === 0n && nvdaOwed === 0n)} onClick={claim}>
              {busy ? "…" : `🎁 Claim safely — NVDA + $FINGERS`}
            </button>

            <div className="gamble-cta">
              <div className="gc-head">
                <span>🎲 Feeling lucky? <b>Double your $FINGERS</b></span>
                <span className="badge win">🎰 Jackpot {fmtF(jackpot as bigint | undefined)}</span>
              </div>
              <p className="gc-sub">Flip your <b>{fmtF(claimable)} $FINGERS</b> on a provably-fair 50/50. <b className="up">Win →</b> up to <b>2×</b> (bonus from the jackpot). <b className="dn">Lose →</b> your $FINGERS drops into the jackpot for the next winner. No burns, supply-neutral — pure player-vs-player. Your NVDA yield is never at risk; only the $FINGERS rides.</p>
              <button className="btn full" disabled={!isConnected || busy || claimable === 0n} onClick={() => {
                if (!confirm(`Gamble your ${fmtF(claimable)} $FINGERS on a 50/50?\n\nWIN → up to 2× (from the jackpot)\nLOSE → it feeds the jackpot for the next winner\n\nYour NVDA yield stays safe. Continue?`)) return;
                gamble();
              }}>
                {busy ? "Flipping…" : `🎲 Gamble ${fmtF(claimable)} $FINGERS → up to ${fmtF(claimable * 2n)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
