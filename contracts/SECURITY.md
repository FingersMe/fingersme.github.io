# Fingers Me — Security Review (self-audit)

**Date:** 2026-08-19 · **Chain:** Robinhood (chainId 4663), Uniswap v4 · **Solidity:** 0.8.28, OZ 5.6, viaIR+cancun
**Method:** manual line-by-line review by the author + 22 unit tests + a full-lifecycle simulation, cross-checked against the audited `luckylaunch2` reference and its `SECURITY_AUDIT.md`.

> ⚠️ **This is a self-review, not an independent professional audit.** It does NOT guarantee the
> system is unhackable. Two classes of risk are only partially covered here and MUST be closed
> before real funds: (a) the Uniswap-v4 swap paths (hook / migrator / seeder / zap) are unit-tested
> for auth + config but their live swap/settle accounting needs **fork tests against the live
> Robinhood v4 PoolManager** (run on the deploy machine with RPC); (b) an **independent audit** of
> the full system. Treat everything below as engineering diligence, not a clean bill of health.

## Scope
`FingersMe` (game), `FingersToken`, `FingersWinnerNFT`/`FingersLoserNFT`, `FingersNFTStaking`,
`FingersClaim`, `FingersStaking`, `FingersHook`, `FingersLPMigrator`, `FingersBasketSeeder`, `FingersZap`.

## Security model & invariants (verified)

### FingersMe (the money core)
- **USDG partition invariant** — every USDG the contract holds belongs to exactly one bucket:
  `balance == winUsdgRetained + sinkAccrued + stakerAccrued` (minus what's already flushed/withdrawn).
  Each exit path moves ONLY its own bucket and zeroes it: `withdrawWinUsdg`→WIN (owner→lpTreasury),
  `flushToSink`→75%-loss (immutable sink `0x91b5…167f`), `flushToStaking`→25%-loss (NFT stakers).
  No path can touch another bucket. *Tested: partition equals balance; owner-gated withdraw.*
- **Loss split** — a losing/forfeited paid attempt splits 25% stakers / 75% sink; a win retains its
  USDG; free attempts move no money. *Tested.*
- **Winner cap (hard)** — `MAX_WINNERS = 1,000,000`: new commits blocked at the cap, and a would-be
  win past the cap is settled as a loss in `_reveal`. Winner supply can never exceed 1M.
- **Commit-reveal fairness** — USDG charged at commit; outcome = `sha256(blockhash‖player‖commitId) %
  10000 < winChanceBp`, deterministic once the block hash is known; reveal is permissionless; an
  un-revealed commit is forfeited (as a loss) after the 256-block window, so refusing to reveal a
  loss never profits.
- **Reentrancy** — `nonReentrant` + checks-effects-interactions on every state-changing entry; the
  winner-NFT mint's `onERC721Received` callback cannot re-enter (guard holds). *Tested with a
  malicious ERC721 receiver.*
- **`commitFor`** — payer pays, `player` owns the attempts; can only ever GIFT an entry, never take
  one. *Tested.*
- **Access control** — `usdgSink` immutable (owner can never redirect the 75%); `setNftStaking`
  one-time bind; `lpTreasury`/pause/close owner-only. *Tested (once-bind, owner-gate).*

### FingersToken
- Fixed 100,000,000 supply minted once (50M LP + 50M claim); **no mint path** ever; burnable
  (asserted `totalSupply == MAX_SUPPLY` at construction). Plain ERC20 → fee is pool-level (hook), so
  transfers/staking/LP are never double-taxed.

### FingersNFTStaking / FingersStaking
- MasterChef accounting with **measured balance-delta** reward intake → `notifyReward` needs no
  trusted caller and a fake amount can't inflate it; rewards arriving with zero stake are held in
  `pendingNoStakers`. *Tested.*
- NFT staking weight = 1 share per NFT (linear, un-gameable). Fingers staking weight is boosted by
  staked-NFT count and amount, **hard-capped** (`MAX_NFT_BOOST_BP`/`MAX_TOTAL_BOOST_BP`), refreshable
  only via `syncBoost` which settles first (no retro-credit). Early-exit forfeit is redistributed to
  remaining stakers (solvent — nothing minted/seized). *Tested: split, boost, cap, forfeit.*
- No owner path moves user principal or seizes rewards.

### FingersClaim
- `open()` only once the game reports **fully settled** → winner count and `perNFTShare` are final and
  the 50M is always fully funded. Claim is **non-destructive** (per-`tokenId` flag, no burn) so NFTs
  stay stakeable; no double claim; only integer-division dust above the outstanding obligation is
  sweepable. *Tested.*

### FingersHook / Migrator / Seeder / Zap (v4)
- Hook deployed at a **CREATE2-mined address** whose low bits encode the afterSwap permission flags
  (`0x44`); `registerPool` gated to the registrar; fee knobs **≤ 1% each, decrease-only**; owner-only
  automation setters with bounds. *Tested: mine+deploy+perms, registrar gate, knob cap, owner bounds.*
- LP is owned by the **immutable** migrator/seeder with **NO withdraw/collect/decrease path** →
  liquidity is rug-proof once seeded. Grief-proof init (adopts an existing pool's price instead of
  reverting — reference audit HIGH-1).
- Zap keeps the price oracle OUT of the game's critical path: it swaps the USER's own funds bounded by
  their `minUsdgOut`, so a bad route only affects that caller, never protocol solvency.

### New in v2 (reviewed 2026-08-21): free credits, sell-back, vote-gated emergency
- **Multi free-credit + owner-unlimited** — `grantFree(wallets[], amount)` adds credits; `commitFree(n)`
  consumes `n` credits (owner spends none, unlimited). A free roll is still the same 40% gamble and its
  win counts toward the 1M cap (winnerPaid stays 0 → not sell-back eligible). **No guaranteed-winner path
  exists** — the owner cannot mint a winner directly; it can only pay/free-roll like anyone. *Tested:
  credit accounting, owner-unlimited, revoke, insufficient-credits revert.*
- **Winner sell-back** — `sellBackWinner(tokenId)` requires caller to hold the token (staked NFTs held by
  the staking contract are excluded → must unstake first), refunds `75% × winnerPaid` from the WIN bucket
  (`require(winUsdgRetained ≥ refund)`), burns the NFT, and clears eligibility. The remaining 25% stays in
  the WIN bucket as house margin, so the **partition invariant is preserved** (sell-back only debits WIN).
  Free wins (winnerPaid 0) are ineligible. CEI + `nonReentrant`. *Tested: refund math, burn, ineligible-free,
  not-owner revert, WIN bucket decrement.*
- **Emergency withdraw is NOT unilateral** — replaced a raw owner drain with a **winner-NFT vote**:
  `proposeEmergency(token,to)` snapshots the winner electorate; holders `voteEmergency(tokenIds[])`
  (1 NFT = 1 vote, staked NFTs vote via `stakerOf`, each token once per proposal-nonce); the owner may
  `executeEmergency()` **only** once `yesVotes×2 ≥ supplySnapshot` (50%). Drains the full token balance to
  `to` and zeroes all three bucket counters. `cancelEmergency()` scraps a proposal (bumping the nonce
  invalidates old votes). This is a deliberate, disclosed centralization-mitigation: the team's *earned*
  margin (retained wins + immutable sink) is always theirs; the *pooled* USDG can only move with holder
  consent. *Tested: non-owner cannot propose, under-threshold cannot execute, double-vote no-ops, crossing
  50% enables the drain, buckets zeroed.*
- **Trade-off surfaced to users** in the app's "Trust & safety" panel so nobody is surprised the pool is
  movable-by-vote. The `emergencyWithdraw` event and on-chain proposal give a public trail.

### New in v3 (reviewed 2026-08-21): rounds, 30-day countdown, finalize-anytime
- **Soft escalating cap** — `winnerCap` starts small (e.g. 100) and auto-×10s to the next tier inside
  `_reveal` (`_maybeEscalateRound`) as winners mint, capped at the immutable `MAX_WINNERS` (1,000,000).
  It is a **progress/marketing marker only** — the sole HARD limit remains `MAX_WINNERS` (a win past it is
  still forced to a loss). No overflow: ×10 is bounded by MAX_WINNERS. *Tested: escalation 1→2, cap math.*
- **30-day countdown** — `deadline` set at deploy (`block.timestamp + _durationSecs`, bounded 1h…365d).
  All commit paths (`_commitFor`, `commitFree`) require `block.timestamp < deadline`. `extendDeadline` is
  owner-only and **can only push out** (`newDeadline > deadline`, ≤ now+365d) — never shorten. *Tested:
  commits revert after deadline, extend re-opens, shrink reverts.*
- **finalize() anytime** — owner closes the raise whenever (cap/deadline irrelevant); `closeRound1` kept as
  a thin alias. Funds are never trapped: `withdrawWinUsdg` / flushes are callable independent of finalize.
  *Tested: finalize mid-raise blocks new commits; raiseInfo reflects live state.*
- Read-only `raiseInfo()` / `timeLeft()` added for the UI countdown + analytics (no state change).

### New in v4 (reviewed 2026-08-21): NVDA payment + $FINGERS staking emission
- **Payment token = NVDA** (tokenized NVIDIA RWA, 18 dec), mintPrice 0.005 NVDA. Purely a deploy-config
  change — the game/staking are token-agnostic (`IERC20`); all invariants (bucket partition, loss split,
  sell-back, emergency vote) hold identically with NVDA as the quote token.
- **50M $FINGERS is EMITTED to NFT stakers over 90 days** (replaces the one-time FingersClaim). Implemented
  as a SEPARATE track in FingersNFTStaking (does not touch the balance-delta USDG/NVDA reward set):
  `startFingersEmission(token, dur)` (emissionAdmin-only, once, requires the 50M already funded) sets
  `rate = 50M/dur`. `_accrueFingers()` recognizes `elapsed*rate` (capped at 50M) on every stake/unstake/claim,
  routing it to `fingersAccPerShare` (split by staked-NFT count → dilutes) or, when nobody is staked, to
  `fingersPendingNoStakers` (reserved for the team, NOT folded to a late staker). `pendingFingers(user)`
  mirrors the accrual for the UI. After the window, `sweepFingersLeftover(to)` pulls ONLY
  `pendingNoStakers + never-emitted division dust` to the LP wallet — provably never staker-owed funds
  (those live in accPerShare, claimable forever). `emissionAdmin` can ONLY start/sweep — it can never move a
  staked NFT or seize a staker's rewards (custody-safety preserved). *Tested: admin/once/underfunded guards,
  streaming + dilution + claim payout, recognized ≤ 50M cap, full no-staker sweep after end.*

### New in v5 (reviewed 2026-08-21): trustless auto-tokenomics (wins→locked LP, auto-emission)
- **Wins → permanently-locked LP, NOT the team.** WIN-NVDA accrues in the game and is flushed by the
  PERMISSIONLESS `flushToLp()` to the immutable `FingersLPMigrator` (no more owner `withdrawWinUsdg`).
  The 50M LP $FINGERS is funded into the migrator at deploy (team wallet keeps 0). Once the game reports
  `isSettled()`, the PERMISSIONLESS `migrator.graduateAuto()` pairs the FULL FINGERS+NVDA balances into a
  **perma-locked FINGERS/NVDA v4 pool** (the migrator has no withdraw/collect/decrease path — rug-proof).
  One-shot (`graduated` flag). `configureAuto` is admin-once. Grief-proof init inherited. Launch price =
  50M FINGERS : total WIN-NVDA raised. *Tested: config once/admin-gate, graduateAuto gated on
  configured + settled + non-empty; flushToLp needs a migrator and moves only the WIN bucket.*
- **Emission auto-starts on first stake.** `configureEmission(token,dur)` (admin-once, requires funded)
  stores the 90-day window without starting; the first `stake()` fires `_startEmission()` — no manual
  step. `startFingersEmission()` (no-arg) is an admin fallback if nobody stakes. *Tested: configure
  guards, fingersRate 0 until first stake then >0, dilution + claim payout unchanged.*
- Sell-back still debits the WIN bucket (works pre-graduation; after the wins are flushed to LP the
  refund reserve is empty → sell-back reverts, which is correct — value is now locked liquidity).
- Team's only revenue = the immutable 75%-of-losses sink. Everything else (wins, LP, emission) is
  automated and non-custodial. This is the maximally-trustless configuration of the system.

## Residual risks (documented, must be addressed operationally)
1. **v4 swap-path fork tests — DONE (pass on the live Robinhood v4 PoolManager).** Hook fee-take/
   settle + burn + reflexive buyback, zap asset→USDG swap + commit, basket auto-seed
   swap+create+lock+register, and migrator grief-proof init + locked LP all pass against the real v4.
   (An independent audit is still required — this is engineering diligence, not a clean bill.)
2. **Randomness** — the seed derives from `blockhash(commitBlock)`; a block producer can bias/withhold.
   Accepted only under Robinhood's single-sequencer trust model (same as the reference).
3. **Basket routing** — USDG→SPY/GME may be unroutable on Robinhood (no known pool). With the chosen
   **manual-LP model** this is moot (team seeds by hand); if auto-seeding is ever enabled, an
   unroutable leg reverts graduation (retry) — funds recoverable via the game's emergency withdraw.
4. **"Other pool" fee dodge** — the 1% fee is enforced only in hooked pools; concentrate liquidity in
   the hooked, locked pools so virtually all volume pays the fee (accepted, documented).
5. **Ownership** — factory-less design, but hook/staking/migrator/seeder/game ownership stays on the
   deployer EOA until moved to a multisig; do so before launch.
6. **Independent audit** — REQUIRED before real funds.

## Test status
**39/39 tests green — 35 unit + 4 live Robinhood-v4 fork** (v3 added 3: rounds/countdown/finalize; v2 added 3: free-credits,
sell-back, vote-gated emergency). `scripts/simulate.js` reconciles every USDG bucket end-to-end and
projects to the 1,000,000-winner scale. Compiles clean (viaIR, cancun).

> **v2 redeploy required:** the game contract's ABI/logic changed (free-credit API, `sellBackWinner`,
> emergency governance). The addresses deployed 2026-08-20 are pre-v2 and must be **re-deployed**; update
> `frontend/.env` `VITE_ADDR_*` with the new `fingers-deployment.robinhood.json` output.
