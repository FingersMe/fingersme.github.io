import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { decodeEventLog, formatUnits, maxUint256 } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, erc20Abi, isDeployed } from "../lib/contracts";
import { ResultModal, type Res } from "../components/ResultModal";

type Attempt = { id: bigint; block: bigint };
type Result = { id: bigint; won: boolean; nftId: bigint };

const LS_KEY = "fingers.pendingCommits";

export function MintPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const [count, setCount] = useState(1);
  const [pending, setPending] = useState<Attempt[]>(() => load());
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Res[] | null>(null);

  const deployed = isDeployed(addresses.game);

  const { data: price } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "mintPrice", query: { enabled: deployed } });
  const { data: bal } = useReadContract({ address: addresses.usdg, abi: erc20Abi, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: allowance, refetch: refetchAllow } = useReadContract({
    address: addresses.usdg, abi: erc20Abi, functionName: "allowance",
    args: address ? [address, addresses.game] : undefined, query: { enabled: !!address && deployed },
  });
  const { data: freeCredits, refetch: refetchFree } = useReadContract({
    address: addresses.game, abi: abi.game, functionName: "freeCredits",
    args: address ? [address] : undefined, query: { enabled: !!address && deployed, refetchInterval: 15_000 },
  });
  const { data: owner } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "owner", query: { enabled: deployed } });
  const isOwner = !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();
  const credits = (freeCredits as bigint | undefined) ?? 0n;
  const canFree = isOwner || credits > 0n;

  const mintPrice = (price as bigint) ?? 1_000_000n;
  const cost = mintPrice * BigInt(count);
  const needsApprove = (allowance as bigint | undefined) !== undefined && (allowance as bigint) < cost;

  useEffect(() => save(pending), [pending]);

  async function approve() {
    try {
      setBusy(true);
      const hash = await writeContractAsync({ address: addresses.usdg, abi: erc20Abi, functionName: "approve", args: [addresses.game, maxUint256] });
      await publicClient!.waitForTransactionReceipt({ hash });
      await refetchAllow();
      toast.success("USDG approved");
    } catch (e: any) { toast.error(shortErr(e)); } finally { setBusy(false); }
  }

  async function commit(free = false) {
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: addresses.game, abi: abi.game,
        functionName: free ? "commitFree" : "commit", args: [BigInt(count)],
      });
      const rc = await publicClient!.waitForTransactionReceipt({ hash });
      const fresh: Attempt[] = [];
      for (const log of rc.logs) {
        try {
          const ev = decodeEventLog({ abi: abi.game, data: log.data, topics: log.topics });
          if (ev.eventName === "Committed") {
            const a = ev.args as any;
            if ((a.player as string).toLowerCase() === address!.toLowerCase())
              fresh.push({ id: a.commitId as bigint, block: a.commitBlock as bigint });
          }
        } catch { /* not our event */ }
      }
      setPending((p) => [...p, ...fresh]);
      refetchFree();
      toast.success(`Committed ${fresh.length} play${fresh.length > 1 ? "s" : ""}! Confirm the reveal in your wallet 👀`);
      // Auto-prompt the reveal so nobody forgets — wait for the reveal window (1 block) then reveal.
      await autoReveal(fresh);
    } catch (e: any) { toast.error(shortErr(e)); } finally { setBusy(false); }
  }

  async function autoReveal(items: Attempt[]) {
    if (items.length === 0) return;
    try {
      // reveal needs block > commitBlock; wait for the next block to be mined
      const start = items.reduce((m, a) => (a.block > m ? a.block : m), 0n);
      for (let i = 0; i < 20; i++) {
        const bn = await publicClient!.getBlockNumber();
        if (bn > start) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      await doReveal(items.map((a) => a.id));
    } catch (e: any) {
      // user can still reveal manually from the right-hand panel
      toast(`Reveal when ready → hit "Reveal" on the right.`, { icon: "⏳" });
    }
  }

  async function doReveal(ids: bigint[]) {
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: addresses.game, abi: abi.game, functionName: "revealBatch", args: [ids] });
      const rc = await publicClient!.waitForTransactionReceipt({ hash });
      const out: Result[] = [];
      for (const log of rc.logs) {
        try {
          const ev = decodeEventLog({ abi: abi.game, data: log.data, topics: log.topics });
          if (ev.eventName === "Revealed") {
            const a = ev.args as any;
            out.push({ id: a.commitId as bigint, won: a.won as boolean, nftId: a.nftId as bigint });
          }
        } catch { /* skip */ }
      }
      const done = new Set(ids.map((x) => x.toString()));
      setResults((r) => [...out, ...r]);
      setPending((p) => p.filter((x) => !done.has(x.id.toString())));
      if (out.length) setModal(out); // pop the win/lose reveal
    } catch (e: any) { toast.error(shortErr(e)); } finally { setBusy(false); }
  }

  async function revealAll() { await doReveal(pending.map((p) => p.id)); }

  if (!deployed) {
    return <div className="card glow"><div className="notice">Contracts aren't wired to this build yet. Deploy with <span className="mono">scripts/deploy.js</span> and set the <span className="mono">VITE_ADDR_*</span> env vars (or edit <span className="mono">src/lib/contracts.ts</span>).</div></div>;
  }

  return (
    <>
    <ResultModal results={modal} onClose={() => setModal(null)} />
    <div className="grid two">
      <div className="card glow">
        <h2>Pull the trigger</h2>
        <p className="sub">Each play costs <b className="mono">{formatUnits(mintPrice, 6)} USDG</b> and gets its own provably-fair roll. Batch up to 50.</p>

        <label className="hint" style={{ display: "block", marginBottom: 6 }}>Number of plays</label>
        <div className="row">
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(clamp(parseInt(e.target.value || "1"), 1, 50))} />
          <div className="row" style={{ gap: 6 }}>
            {[1, 5, 10, 25].map((n) => <button key={n} className="btn alt" onClick={() => setCount(n)}>{n}</button>)}
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", margin: "16px 0" }}>
          <span className="muted">Total cost</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{formatUnits(cost, 6)} USDG</span>
        </div>

        {!isConnected ? (
          <div className="notice">Connect your wallet to play.</div>
        ) : needsApprove ? (
          <button className="btn full" disabled={busy} onClick={approve}>{busy ? "Approving…" : "Approve USDG"}</button>
        ) : (
          <button className="btn full pulse" disabled={busy || isPending} onClick={() => commit(false)}>{busy ? "Committing…" : `🎲 Play ${count}×`}</button>
        )}

        {canFree && (
          <button className="btn full win" style={{ marginTop: 10 }} disabled={busy} onClick={() => commit(true)}>
            {busy ? "…" : isOwner ? `🎟️ Play ${count}× FREE (owner)` : `🎟️ Play ${count}× FREE — ${credits.toString()} credit${credits === 1n ? "" : "s"} left`}
          </button>
        )}

        <div className="hint">
          Balance: <span className="mono">{bal !== undefined ? formatUnits(bal as bigint, 6) : "—"} USDG</span> ·
          {" "}No USDG? Use the <b>Swap → USDG</b> tab to bring any asset in via LI.FI.
        </div>
      </div>

      <div className="card">
        <h2>Reveal</h2>
        <p className="sub">Outcomes are locked at commit and revealed a block later — nobody can grind the result.</p>

        {pending.length > 0 ? (
          <>
            <div className="notice pulse" style={{ marginBottom: 14, color: "var(--green)", borderColor: "rgba(0,255,136,.4)" }}>
              {pending.length} play{pending.length > 1 ? "s" : ""} ready to reveal
            </div>
            <button className="btn full win" disabled={busy} onClick={revealAll}>{busy ? "Revealing…" : `🔮 Reveal ${pending.length}`}</button>
          </>
        ) : (
          <div className="notice">No pending plays. Commit some on the left, then reveal here.</div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="hint" style={{ marginBottom: 8 }}>Recent results</div>
            <div className="row" style={{ gap: 8 }}>
              {results.slice(0, 24).map((r) => (
                <span key={r.id.toString()} className={`badge ${r.won ? "win" : "lose"}`}>
                  {r.won ? "WIN #" + r.nftId.toString() : "LOSE"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, isNaN(n) ? lo : n)); }
function shortErr(e: any) { const m = e?.shortMessage || e?.message || "Transaction failed"; return String(m).slice(0, 120); }
function load(): Attempt[] { try { return (JSON.parse(localStorage.getItem(LS_KEY) || "[]") as any[]).map((a) => ({ id: BigInt(a.id), block: BigInt(a.block) })); } catch { return []; } }
function save(a: Attempt[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(a.map((x) => ({ id: x.id.toString(), block: x.block.toString() })))); } catch {} }
