import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits, isAddress, type Address } from "viem";
import toast from "react-hot-toast";
import { addresses, abi, isDeployed } from "../lib/contracts";

const USDG_DECIMALS = 6; // Robinhood USDG
const PHASE_LABELS = ["Round 1 — Open", "Closed — Settling", "Settled"];

function usdg(v: unknown) {
  return v === undefined ? "—" : Number(formatUnits(v as bigint, USDG_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function AdminPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<string>("");
  const [freeInput, setFreeInput] = useState("");
  const [freeAmount, setFreeAmount] = useState("1");
  const [revokeInput, setRevokeInput] = useState("");
  const [snapInput, setSnapInput] = useState("");
  const [dustInput, setDustInput] = useState("");
  const [emgToken, setEmgToken] = useState(addresses.usdg as string);
  const [emgTo, setEmgTo] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");

  const deployed = isDeployed(addresses.game);

  const { data: owner } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "owner", query: { enabled: deployed } });
  const { data: stats, refetch: refetchStats } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "stats", query: { enabled: deployed, refetchInterval: 12_000 } });
  const { data: paused, refetch: refetchPaused } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "paused", query: { enabled: deployed, refetchInterval: 12_000 } });
  const { data: settled, refetch: refetchSettled } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "isSettled", query: { enabled: deployed, refetchInterval: 12_000 } });
  const { data: claimOpened, refetch: refetchOpened } = useReadContract({ address: addresses.claim, abi: abi.claim, functionName: "opened", query: { enabled: isDeployed(addresses.claim), refetchInterval: 12_000 } });
  const { data: emg, refetch: refetchEmg } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "emergency", query: { enabled: deployed, refetchInterval: 12_000 } });
  const { data: emgPasses, refetch: refetchEmgPass } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "emergencyPasses", query: { enabled: deployed, refetchInterval: 12_000 } });
  const { data: raise } = useReadContract({ address: addresses.game, abi: abi.game, functionName: "raiseInfo", query: { enabled: deployed, refetchInterval: 12_000 } });

  const isOwner = !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();

  // stats tuple: [phase, totalAttempts, totalWinners, winnersRemaining, totalLosers, unsettled, totalUsdgCollected, winUsdgRetained, sinkAccrued, stakerAccrued]
  const s = (stats as readonly bigint[] | undefined);
  const phaseNum = s ? Number(s[0]) : undefined;
  const totalAttempts = s?.[1];
  const totalWinners = s?.[2];
  const winnersRemaining = s?.[3];
  const totalLosers = s?.[4];
  const unsettled = s?.[5];
  const winRetained = s?.[7];
  const sinkAccrued = s?.[8];
  const stakerAccrued = s?.[9];

  async function run(key: string, address_: Address, abi_: any, functionName: string, args: any[], success: string) {
    try {
      setBusy(key);
      const hash = await writeContractAsync({ address: address_, abi: abi_, functionName, args } as any);
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success(success);
      refetchStats(); refetchPaused(); refetchSettled(); refetchOpened(); refetchEmg(); refetchEmgPass();
    } catch (e: any) {
      toast.error(String(e?.shortMessage || e?.message).slice(0, 140));
    } finally { setBusy(""); }
  }

  if (!deployed) return <div className="card glow"><div className="notice">Game isn't wired yet — set <span className="mono">VITE_ADDR_GAME</span>.</div></div>;

  if (!isConnected) return (
    <div className="card glow" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>🛠️ Owner Console</h2>
      <div className="notice" style={{ marginTop: 12 }}>Connect the <b>deployer wallet</b> to unlock owner controls.</div>
    </div>
  );

  if (!isOwner) return (
    <div className="card glow" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>🔒 Owner Console — locked</h2>
      <p className="sub">This wallet is not the contract owner. Connect the deployer wallet to manage the round.</p>
      <div className="statbar" style={{ gridTemplateColumns: "1fr" }}>
        <div className="stat"><div className="k">Owner</div><div className="v mono" style={{ fontSize: 13 }}>{owner ? (owner as string) : "…"}</div></div>
      </div>
    </div>
  );

  const freeList = freeInput.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean).filter((x) => isAddress(x)) as Address[];
  const revokeOk = isAddress(revokeInput.trim());
  const dustOk = isAddress(dustInput.trim());
  const snapOk = /^\d+$/.test(snapInput.trim());
  const emgSupply = emg ? ((emg as any[])[2] as bigint) : 0n;
  const needVotes = emgSupply > 0n ? ((emgSupply + 1n) / 2n).toString() : "—";
  const ri = raise as any[] | undefined;
  const raiseRound = ri ? (ri[0] as bigint).toString() : "…";
  const raiseCap = ri ? (ri[1] as bigint).toLocaleString() : "…";
  const raiseDeadline = ri ? new Date(Number(ri[2] as bigint) * 1000).toLocaleString() : "…";
  const deadlineTs = deadlineInput ? Math.floor(new Date(deadlineInput).getTime() / 1000) : 0;

  return (
    <div className="grid" style={{ gap: 18, maxWidth: 820, margin: "0 auto" }}>
      {/* Live state */}
      <div className="card glow">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2>🛠️ Owner Console</h2>
          <span className={`badge ${paused ? "lose" : "win"}`}>{paused ? "PAUSED" : "LIVE"}</span>
        </div>
        <div className="statbar" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="stat"><div className="k">Phase</div><div className="v gold">{phaseNum !== undefined ? (PHASE_LABELS[phaseNum] ?? `#${phaseNum}`) : "…"}</div></div>
          <div className="stat"><div className="k">Winners</div><div className="v green">{totalWinners?.toLocaleString() ?? "…"}</div></div>
          <div className="stat"><div className="k">Losers</div><div className="v">{totalLosers?.toLocaleString() ?? "…"}</div></div>
          <div className="stat"><div className="k">Plays</div><div className="v">{totalAttempts?.toLocaleString() ?? "…"}</div></div>
          <div className="stat"><div className="k">Unsettled</div><div className="v" style={{ color: unsettled && unsettled > 0n ? "var(--orange)" : undefined }}>{unsettled?.toLocaleString() ?? "…"}</div></div>
          <div className="stat"><div className="k">Winners left</div><div className="v">{winnersRemaining?.toLocaleString() ?? "…"}</div></div>
          <div className="stat"><div className="k">Settled?</div><div className="v">{settled ? "YES" : "no"}</div></div>
          <div className="stat"><div className="k">Claim</div><div className="v">{claimOpened ? "OPEN" : "closed"}</div></div>
        </div>
        <div className="statbar" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 10 }}>
          <div className="stat"><div className="k">WIN USDG (withdrawable)</div><div className="v gold">{usdg(winRetained)}</div></div>
          <div className="stat"><div className="k">Sink accrued (75%)</div><div className="v">{usdg(sinkAccrued)}</div></div>
          <div className="stat"><div className="k">Staker accrued (25%)</div><div className="v green">{usdg(stakerAccrued)}</div></div>
        </div>
      </div>

      {/* Round control */}
      <div className="card glow">
        <h2>🎮 Raise control</h2>
        <p className="sub">The winner cap auto-escalates ×10 (round 1→2→3…). Pause anytime, extend the 30-day countdown, or <b>finalize</b> the raise whenever you want — funds are never trapped (withdraw WIN-USDG below).</p>
        <div className="statbar" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 12 }}>
          <div className="stat"><div className="k">Round</div><div className="v gold">{raiseRound}</div></div>
          <div className="stat"><div className="k">Winner cap (tier)</div><div className="v">{raiseCap}</div></div>
          <div className="stat"><div className="k">Ends</div><div className="v" style={{ fontSize: 14 }}>{raiseDeadline}</div></div>
        </div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="btn" disabled={!!busy} onClick={() => run("pause", addresses.game, abi.game, "setPaused", [!paused], paused ? "Game resumed" : "Game paused")}>
            {busy === "pause" ? "…" : paused ? "▶️ Resume game" : "⏸️ Pause game"}
          </button>
          <button className="btn red" disabled={!!busy} onClick={() => {
            if (!confirm("Finalize the raise? No new plays after this — only reveals/forfeits, then open claim + seed LP. Irreversible.")) return;
            run("close", addresses.game, abi.game, "finalize", [], "Raise finalized");
          }}>
            {busy === "close" ? "Finalizing…" : "🏁 Finalize raise"}
          </button>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <input type="datetime-local" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} style={{ flex: 2, minWidth: 200 }} />
          <button className="btn" disabled={!!busy || !deadlineTs} onClick={() => run("extend", addresses.game, abi.game, "extendDeadline", [BigInt(deadlineTs)], "Deadline extended")}>
            {busy === "extend" ? "…" : "⏱️ Extend deadline"}
          </button>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <input type="text" placeholder="block number to snapshot (e.g. 12345678)" value={snapInput} onChange={(e) => setSnapInput(e.target.value)} />
          <button className="btn" disabled={!!busy || !snapOk} onClick={() => run("snap", addresses.game, abi.game, "snapshotBlockHash", [BigInt(snapInput.trim())], "Block hash snapshotted")}>
            {busy === "snap" ? "…" : "📸 Snapshot"}
          </button>
        </div>
        <div className="hint" style={{ marginTop: 6 }}>Snapshot only if a commit's block is about to age past the 256-block window before its owner reveals.</div>
      </div>

      {/* Settlement flows */}
      <div className="card glow">
        <h2>💸 Settlement & payouts</h2>
        <p className="sub">After every play is settled: push loss splits to their pools, then pull the retained WIN USDG to your LP wallet.</p>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="btn" disabled={!!busy} onClick={() => run("staking", addresses.game, abi.game, "flushToStaking", [], "25% flushed to NFT stakers")}>
            {busy === "staking" ? "…" : `🥩 Flush → stakers (${usdg(stakerAccrued)})`}
          </button>
          <button className="btn" disabled={!!busy} onClick={() => run("sink", addresses.game, abi.game, "flushToSink", [], "75% flushed to sink")}>
            {busy === "sink" ? "…" : `🕳️ Flush → sink (${usdg(sinkAccrued)})`}
          </button>
          <button className="btn" disabled={!!busy} onClick={() => run("withdraw", addresses.game, abi.game, "withdrawWinUsdg", [], "WIN USDG withdrawn to LP wallet")}>
            {busy === "withdraw" ? "…" : `🏦 Withdraw WIN USDG (${usdg(winRetained)})`}
          </button>
        </div>
      </div>

      {/* Claim control */}
      <div className="card glow">
        <h2>🎁 $FINGERS claim</h2>
        <p className="sub">Opening snapshots the Winner supply and fixes the per-NFT share of 50,000,000 $FINGERS. Open only once the round is fully settled.</p>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="btn" disabled={!!busy || !isDeployed(addresses.claim) || !!claimOpened} onClick={() => {
            if (!settled) { toast.error("Round not settled yet — settle every play first."); return; }
            if (!confirm("Open claiming? The per-NFT share is locked in permanently at this moment.")) return;
            run("open", addresses.claim, abi.claim, "open", [], "Claiming opened 🎉");
          }}>
            {busy === "open" ? "Opening…" : claimOpened ? "✅ Claim already open" : "🔓 Open claiming"}
          </button>
          <div className="row" style={{ gap: 8, flex: 1, minWidth: 260 }}>
            <input type="text" placeholder="sweep leftover dust to address 0x…" value={dustInput} onChange={(e) => setDustInput(e.target.value)} />
            <button className="btn" disabled={!!busy || !dustOk} onClick={() => run("dust", addresses.claim, abi.claim, "sweepDust", [dustInput.trim() as Address], "Dust swept")}>
              {busy === "dust" ? "…" : "🧹 Sweep"}
            </button>
          </div>
        </div>
      </div>

      {/* Free plays */}
      <div className="card glow">
        <h2>🎟️ Free-play credits (whitelist)</h2>
        <p className="sub">Grant wallets any number of free rolls (no USDG) for giveaways, quests and partner drops. Each credit is one 40% gamble — you (the owner) play unlimited without credits. Adds to any existing balance.</p>
        <div className="row" style={{ gap: 8 }}>
          <input type="text" placeholder="0xabc…, 0xdef… (comma / space separated)" value={freeInput} onChange={(e) => setFreeInput(e.target.value)} style={{ flex: 3, minWidth: 220 }} />
          <input type="number" min={1} placeholder="credits" value={freeAmount} onChange={(e) => setFreeAmount(e.target.value)} style={{ flex: 1, minWidth: 90 }} />
          <button className="btn" disabled={!!busy || freeList.length === 0 || !(Number(freeAmount) >= 1)} onClick={() => run("grant", addresses.game, abi.game, "grantFree", [freeList, BigInt(Math.floor(Number(freeAmount) || 0))], `Granted ${freeAmount}× to ${freeList.length} wallet(s)`)}>
            {busy === "grant" ? "…" : `Grant ${freeAmount || ""}× to ${freeList.length || 0}`}
          </button>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <input type="text" placeholder="revoke all credits from one address 0x…" value={revokeInput} onChange={(e) => setRevokeInput(e.target.value)} />
          <button className="btn red" disabled={!!busy || !revokeOk} onClick={() => run("revoke", addresses.game, abi.game, "revokeFree", [revokeInput.trim() as Address], "Free credits revoked")}>
            {busy === "revoke" ? "…" : "Revoke"}
          </button>
        </div>
      </div>

      {/* Emergency withdrawal (vote-gated) */}
      <div className="card glow" style={{ borderColor: "rgba(245,166,35,.35)" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ color: "var(--orange)" }}>🚨 Emergency withdrawal (vote-gated)</h2>
          {emg && (emg as any[])[4] && !(emg as any[])[5]
            ? <span className="badge gold">{emgPasses ? "PASSED ✅" : "voting…"}</span>
            : <span className="badge">idle</span>}
        </div>
        <p className="sub">You can <b>not</b> drain funds alone. Open a proposal, let Winner-NFT holders vote, and execute only once <b>50% of the winner supply</b> approves. Your earned margin (retained wins + treasury sink) is separate and always yours.</p>

        {emg && (emg as any[])[4] && !(emg as any[])[5] ? (
          <>
            <div className="statbar" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 12 }}>
              <div className="stat"><div className="k">Yes votes</div><div className="v green">{(emg as any[])[3]?.toString?.() ?? "…"}</div></div>
              <div className="stat"><div className="k">Needed (50%)</div><div className="v gold">{needVotes}</div></div>
              <div className="stat"><div className="k">Electorate</div><div className="v">{(emg as any[])[2]?.toString?.() ?? "…"}</div></div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn" disabled={!!busy || !emgPasses} onClick={() => {
                if (!confirm("Execute the emergency withdrawal? This drains the full token balance to the destination.")) return;
                run("emgExec", addresses.game, abi.game, "executeEmergency", [], "Emergency withdrawal executed");
              }}>{busy === "emgExec" ? "…" : "🏧 Execute (drain)"}</button>
              <button className="btn red" disabled={!!busy} onClick={() => run("emgCancel", addresses.game, abi.game, "cancelEmergency", [], "Proposal cancelled")}>
                {busy === "emgCancel" ? "…" : "Cancel proposal"}
              </button>
            </div>
          </>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <input type="text" placeholder="token (default USDG)" value={emgToken} onChange={(e) => setEmgToken(e.target.value)} style={{ flex: 2, minWidth: 180 }} />
            <input type="text" placeholder="destination 0x…" value={emgTo} onChange={(e) => setEmgTo(e.target.value)} style={{ flex: 2, minWidth: 180 }} />
            <button className="btn" disabled={!!busy || !isAddress(emgToken.trim()) || !isAddress(emgTo.trim())} onClick={() => run("emgPropose", addresses.game, abi.game, "proposeEmergency", [emgToken.trim() as Address, emgTo.trim() as Address], "Proposal opened — holders can vote")}>
              {busy === "emgPropose" ? "…" : "Open proposal"}
            </button>
          </div>
        )}
      </div>

      {/* Manual LP checklist */}
      <div className="card glow">
        <h2>📋 Manual LP checklist (post Round 1)</h2>
        <ol className="sub" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li><b>Close Round 1</b> above, then settle every play (players reveal, or you can't force — forfeit expires unrevealed) until <b>Settled? = YES</b>.</li>
          <li><b>Open claiming</b> → winners pull 50M $FINGERS pro-rata (NFTs stay stakeable).</li>
          <li><b>Flush → stakers</b> (25% losses) and <b>Flush → sink</b> (75%).</li>
          <li><b>Withdraw WIN USDG</b> to your LP wallet.</li>
          <li>Build FINGERS/asset locked pools by hand via <span className="mono">migrator.graduate(hooks=hook)</span>, then <span className="mono">hook.registerPool(key, cfg)</span> on each to switch on the 1% fee engine. <i>(Run from Hardhat — needs PoolKey structs.)</i></li>
        </ol>
        <div className="statbar" style={{ gridTemplateColumns: "1fr", marginTop: 12 }}>
          <div className="stat"><div className="k">Hook</div><div className="v mono" style={{ fontSize: 12 }}>{isDeployed(addresses.hook) ? addresses.hook : "—"}</div></div>
        </div>
      </div>
    </div>
  );
}
