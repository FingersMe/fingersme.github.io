import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, type Address } from "viem";

const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)");
const DEPLOY_BLOCK = (() => { try { return BigInt(import.meta.env.VITE_DEPLOY_BLOCK ?? "0"); } catch { return 0n; } })();

/**
 * Auto-detect the tokenIds a wallet currently owns for an ERC721, by diffing Transfer logs
 * (received minus sent). Best-effort: if the RPC caps getLogs it returns { ids: [], error }
 * so the UI can fall back to manual entry. Removes the friction of pasting tokenIds.
 */
export function useOwnedNfts(nft?: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [ids, setIds] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!address || !publicClient || !nft || nft === "0x0000000000000000000000000000000000000000") { setIds([]); return; }
    setLoading(true); setError(null);
    try {
      const [inLogs, outLogs] = await Promise.all([
        publicClient.getLogs({ address: nft, event: TRANSFER, args: { to: address }, fromBlock: DEPLOY_BLOCK, toBlock: "latest" }),
        publicClient.getLogs({ address: nft, event: TRANSFER, args: { from: address }, fromBlock: DEPLOY_BLOCK, toBlock: "latest" }),
      ]);
      const owned = new Set<string>();
      for (const l of inLogs) owned.add((l.args.tokenId as bigint).toString());
      for (const l of outLogs) owned.delete((l.args.tokenId as bigint).toString());
      setIds([...owned].map((s) => BigInt(s)).sort((a, b) => (a < b ? -1 : 1)));
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || "log scan failed"));
      setIds([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [address, nft]);
  return { ids, loading, error, refresh };
}

/**
 * TokenIds the user has staked into `staking`: Transfer(from=user → staking) that the user
 * hasn't since pulled back (Transfer staking → user). Best-effort; empty + error on RPC caps.
 */
export function useStakedNfts(nft?: Address, staking?: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [ids, setIds] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Z = "0x0000000000000000000000000000000000000000";

  async function refresh() {
    if (!address || !publicClient || !nft || !staking || nft === Z || staking === Z) { setIds([]); return; }
    setLoading(true); setError(null);
    try {
      const [inLogs, outLogs] = await Promise.all([
        publicClient.getLogs({ address: nft, event: TRANSFER, args: { from: address, to: staking }, fromBlock: DEPLOY_BLOCK, toBlock: "latest" }),
        publicClient.getLogs({ address: nft, event: TRANSFER, args: { from: staking, to: address }, fromBlock: DEPLOY_BLOCK, toBlock: "latest" }),
      ]);
      const owned = new Set<string>();
      for (const l of inLogs) owned.add((l.args.tokenId as bigint).toString());
      for (const l of outLogs) owned.delete((l.args.tokenId as bigint).toString());
      setIds([...owned].map((s) => BigInt(s)).sort((a, b) => (a < b ? -1 : 1)));
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || "log scan failed")); setIds([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [address, nft, staking]);
  return { ids, loading, error, refresh };
}
