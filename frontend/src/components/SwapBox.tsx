import { useEffect, useState } from "react";
import { useAccount, useBalance, usePublicClient, useSendTransaction, useWriteContract } from "wagmi";
import { formatUnits, parseUnits, erc20Abi as viemErc20, type Address } from "viem";
import toast from "react-hot-toast";
import { addresses } from "../lib/contracts";
import { usePrices, usd } from "../lib/usePrices";

const CHAIN = 4663;
const NATIVE = "0x0000000000000000000000000000000000000000"; // Robinhood native ETH (per LI.FI chains)
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const FROMS = [
  { sym: "ETH", addr: NATIVE, dec: 18, native: true },
  { sym: "WETH", addr: WETH, dec: 18, native: false },
  { sym: "USDG", addr: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", dec: 6, native: false },
];

type Quote = { toAmount: bigint; approvalAddress: Address; tx: { to: Address; data: `0x${string}`; value: bigint }; toolName: string } | null;

/**
 * Non-custodial swap → NVDA, executed with the app's OWN connected wallet (single connect).
 * Routing/encoding comes from the LI.FI quote API; the actual on-chain swap runs through the
 * Robinhood DEX (Nordstern). No LI.FI widget, no second wallet.
 */
export function SwapBox() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  const [from, setFrom] = useState(FROMS[0]);
  const [amount, setAmount] = useState("0.01");
  const [quote, setQuote] = useState<Quote>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { nvdaUsd } = usePrices();
  const { data: fromBal } = useBalance({ address, token: from.native ? undefined : (from.addr as Address), query: { enabled: !!address, refetchInterval: 12_000 } });
  const balNum = fromBal ? Number(formatUnits(fromBal.value, fromBal.decimals)) : undefined;
  const recvUsd = quote ? Number(fmtNvda(quote.toAmount)) * nvdaUsd : undefined;

  // debounced quote
  useEffect(() => {
    setErr(null); setQuote(null);
    const amt = Number(amount);
    if (!isConnected || !address || !(amt > 0)) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const fromAmount = parseUnits(amount, from.dec).toString();
        const url = `https://li.quest/v1/quote?fromChain=${CHAIN}&toChain=${CHAIN}&fromToken=${from.addr}&toToken=${addresses.usdg}&fromAmount=${fromAmount}&fromAddress=${address}&slippage=0.01`;
        const r = await fetch(url);
        const j = await r.json();
        if (cancelled) return;
        if (!j.transactionRequest || !j.estimate) { setErr(j.message || "No route for this pair/amount — try WETH or a bigger amount."); return; }
        setQuote({
          toAmount: BigInt(j.estimate.toAmount),
          approvalAddress: j.estimate.approvalAddress as Address,
          tx: { to: j.transactionRequest.to as Address, data: j.transactionRequest.data as `0x${string}`, value: BigInt(j.transactionRequest.value || "0") },
          toolName: j.toolDetails?.name || j.tool || "DEX",
        });
      } catch (e: any) { if (!cancelled) setErr("Quote failed — check your connection or amount."); }
      finally { if (!cancelled) setLoading(false); }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [amount, from, address, isConnected]);

  async function swap() {
    if (!quote || !address) return;
    try {
      setBusy(true);
      // ERC20 approval if needed
      if (!from.native) {
        const allowance = await publicClient!.readContract({ address: from.addr as Address, abi: viemErc20, functionName: "allowance", args: [address, quote.approvalAddress] }) as bigint;
        const need = parseUnits(amount, from.dec);
        if (allowance < need) {
          toast("Approve " + from.sym + " first…", { icon: "🔓" });
          const ah = await writeContractAsync({ address: from.addr as Address, abi: viemErc20, functionName: "approve", args: [quote.approvalAddress, need] });
          await publicClient!.waitForTransactionReceipt({ hash: ah });
        }
      }
      const hash = await sendTransactionAsync({ to: quote.tx.to, data: quote.tx.data, value: quote.tx.value });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success(`Swapped → ${fmtNvda(quote.toAmount)} NVDA 🎉 Now pull the trigger!`);
    } catch (e: any) {
      toast.error(String(e?.shortMessage || e?.message || "Swap failed").slice(0, 140));
    } finally { setBusy(false); }
  }

  return (
    <div className="swapbox">
      <div className="sb-row">
        <div className="sb-side">
          <div className="sb-lab" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>You pay</span>
            {balNum !== undefined && (
              <span className="sb-bal">
                Balance: <b>{balNum.toLocaleString(undefined, { maximumFractionDigits: 5 })} {from.sym}</b>
                {balNum > 0 && <button type="button" className="sb-max" onClick={() => setAmount(String(from.native ? Math.max(0, balNum - 0.002) : balNum))}>MAX</button>}
              </span>
            )}
          </div>
          <div className="sb-inp">
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
            <select value={from.sym} onChange={(e) => setFrom(FROMS.find((f) => f.sym === e.target.value)!)}>
              {FROMS.map((f) => <option key={f.sym} value={f.sym}>{f.sym}</option>)}
            </select>
          </div>
        </div>
        <div className="sb-arrow">↓</div>
        <div className="sb-side">
          <div className="sb-lab" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>You receive (est.)</span>
            {recvUsd !== undefined && <span className="sb-bal">≈ {usd(recvUsd)}</span>}
          </div>
          <div className="sb-inp">
            <input readOnly value={quote ? fmtNvda(quote.toAmount) : loading ? "…" : "0.0"} />
            <span className="sb-token nvda-ink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><img src="/nvda.png" alt="" style={{ width: 20, height: 20, borderRadius: 5 }} /> NVDA</span>
          </div>
        </div>
      </div>

      {err && <div className="hint" style={{ color: "var(--down)" }}>{err}</div>}
      {quote && <div className="hint">Rate ≈ {(Number(fmtNvda(quote.toAmount)) / Number(amount || 1)).toPrecision(4)} NVDA / {from.sym} · via {quote.toolName} · 1% slippage · your wallet, non-custodial.</div>}

      {!isConnected ? (
        <div className="notice">Connect your wallet (top) to swap.</div>
      ) : (
        <button className="btn full win" disabled={busy || loading || !quote} onClick={swap}>
          {busy ? "Swapping…" : loading ? "Finding best route…" : quote ? `🔁 Swap ${amount} ${from.sym} → NVDA` : "Enter an amount"}
        </button>
      )}
      <div className="hint" style={{ marginTop: 6 }}>Swaps run on the Robinhood DEX with your connected wallet — one wallet, no widget. Then play.</div>
    </div>
  );
}

function fmtNvda(v: bigint) { return Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 }); }
