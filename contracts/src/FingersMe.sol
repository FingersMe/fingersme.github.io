// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFingersNFT {
    function mint(address to) external returns (uint256 id);
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
    function totalSupply() external view returns (uint256);
}

interface IFingersNFTStaking {
    /// @notice Credit `amount` USDG (already transferred in) to the NFT-staker reward stream.
    function notifyUsdgReward(uint256 amount) external;
    /// @notice The wallet that staked `tokenId` (address(0) if not staked). Lets stakers keep their vote.
    function stakerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title FingersMe — the commit-reveal "gamble to mint" game
 * @notice Users pay `mintPrice` USDG per attempt. Outcome is decided by commit-reveal
 *         randomness (blockhash of the commit block) so nobody — not the user, not the team —
 *         can predict or grind it after paying:
 *            • winChanceBp (default 40%) -> mint a WINNER NFT
 *            • otherwise    (default 60%) -> mint a LOSER NFT (the middle-finger meme)
 *
 *  ── Money flow (per settled attempt) ─────────────────────────────────────────────
 *   USDG is charged at COMMIT time (so seeing the outcome before revealing gives no edge).
 *   At REVEAL the attempt's USDG is directed by outcome:
 *     • LOSS -> LOSS_STAKER_BP (25%) earmarked for the NFT-staker reward pool,
 *               the remaining 75% earmarked for the immutable `usdgSink` (0x91b5…167f).
 *     • WIN  -> retained in this contract as `winUsdgRetained`, withdrawable by the owner
 *               to `lpTreasury` to seed the manual (RWA/meme basket) UniV4 liquidity.
 *   Earmarks are pull-based: `flushToSink()` / `flushToStaking()` are permissionless and
 *   move only their own bucket; `withdrawWinUsdg()` (owner) moves only the retained bucket.
 *   The three buckets partition the USDG balance, so no path can ever touch another's funds.
 *
 *  ── Winner cap ────────────────────────────────────────────────────────────────────
 *   At most MAX_WINNERS (1,000,000) winner NFTs can ever exist. New attempts are blocked
 *   once the cap is reached, and any in-flight attempt that would have won past the cap is
 *   settled as a loss (with the loss money split) — the cap is a hard invariant.
 *
 *  ── Security model ──────────────────────────────────────────────────────────────────
 *   - Commit-reveal seeded by blockhash(commitBlock); reveal waits `revealExtraBlocks`.
 *   - USDG charged at commit; outcome deterministic once the block hash is known.
 *   - ReentrancyGuard + checks-effects-interactions on every state-changing entry point.
 *   - The 75%-loss sink is immutable; the owner can never redirect it.
 */
contract FingersMe is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ── Immutable config ─────────────────────────────────────
    IERC20 public immutable usdg;              // payment token (USDG)
    IFingersNFT public immutable winnerNFT;    // WIN collection
    IFingersNFT public immutable loserNFT;     // LOSS collection
    address public immutable usdgSink;         // receives 75% of every loss (0x91b5…167f) — immutable
    address public immutable creator;          // informational / creator attribution

    uint256 public immutable mintPrice;        // USDG per paid attempt (token units)
    uint256 public immutable winChanceBp;      // win probability in basis points (4000 = 40%)
    uint256 public immutable revealExtraBlocks;// extra blocks to wait before reveal

    uint256 public constant MAX_WINNERS = 1_000_000;    // hard cap on winner NFTs
    uint256 public constant LOSS_STAKER_BP = 2500;      // 25% of a loss -> NFT stakers
    uint256 public constant SELLBACK_REFUND_BP = 7500;  // winner sell-back refunds 75% (25% loss kept by house)
    uint256 public constant BP = 10000;
    uint256 public constant BLOCKHASH_WINDOW = 256;     // EVM blockhash availability window
    uint256 public constant MAX_BATCH = 50;             // max attempts per commit tx

    // ── Phase machine ────────────────────────────────────────
    enum Phase { OPEN, CLOSED }
    Phase public phase = Phase.OPEN;

    // When true, new commits are blocked (reveals/forfeits/flushes always remain available).
    bool public paused;

    // ── Mutable wiring (owner) ───────────────────────────────
    address public lpTreasury;   // where retained WIN USDG is withdrawn (default: owner)
    address public nftStaking;   // NFT-staking contract receiving the 25% loss stream (set once)

    // ── Commit-reveal state ──────────────────────────────────
    struct Commit {
        address player;
        uint96 commitBlock; // block number the attempt was committed in
        bool settled;
        bool free;          // true if this was a granted free attempt
        bool won;           // set on reveal
    }

    uint256 public nextCommitId;
    uint256 public unsettledCommits;      // commits created but not yet revealed/forfeited
    uint256 public totalAttempts;         // paid + free attempts committed
    uint256 public totalWinners;          // winner NFTs minted via reveal
    uint256 public totalLosers;           // loser outcomes (loser NFT or forfeit)

    mapping(uint256 => Commit) public commits;
    mapping(uint256 => bytes32) public commitBlockHashes; // snapshotted block hashes

    // Free-attempt credits (owner grants an arbitrary number per wallet; owner itself is unlimited)
    mapping(address => uint256) public freeCredits;   // unused free plays remaining for a wallet
    uint256 public freeCreditsGranted;                // lifetime credits granted
    uint256 public freeCreditsUsed;                   // lifetime free plays consumed

    // Winner sell-back bookkeeping: USDG paid for the win that minted this token id (0 = free win, not buyback-eligible)
    mapping(uint256 => uint256) public winnerPaid;

    // ── Emergency withdraw governance (winner-NFT vote) ──────────
    // The owner can NOT unilaterally drain funds. To move the pooled USDG in a real emergency the
    // owner opens a proposal; winner-NFT holders vote (1 NFT = 1 vote, staked NFTs vote via their
    // staker). Only once YES votes reach 50% of the winner supply snapshotted at proposal time can
    // the owner execute the drain. This keeps the treasury community-gated instead of a rug switch.
    struct Emergency {
        address token;          // token to sweep (USDG or a stray token)
        address to;             // destination
        uint256 supplySnapshot; // winner-NFT electorate size at proposal time
        uint256 yesVotes;       // winner NFTs that have voted YES
        bool active;            // a live proposal exists
        bool executed;          // already drained
    }
    uint256 public emergencyNonce;                                   // increments per proposal (invalidates old votes)
    Emergency public emergency;                                      // the current/last proposal
    mapping(uint256 => mapping(uint256 => bool)) public emergencyVoted; // nonce => tokenId => voted

    // ── USDG buckets (partition the contract's USDG balance) ──
    uint256 public winUsdgRetained; // WIN money, withdrawable to lpTreasury by owner
    uint256 public sinkAccrued;     // 75%-of-loss money, flushable to usdgSink (permissionless)
    uint256 public stakerAccrued;   // 25%-of-loss money, flushable to nftStaking (permissionless)

    uint256 public totalUsdgCollected; // lifetime USDG taken from paid mints
    uint256 public sinkFlushed;        // lifetime USDG sent to the sink
    uint256 public stakerFlushed;      // lifetime USDG sent to NFT staking
    uint256 public winWithdrawn;       // lifetime WIN USDG withdrawn to lpTreasury

    // ── Events ───────────────────────────────────────────────
    event Committed(uint256 indexed commitId, address indexed player, bool free, uint256 commitBlock);
    event Revealed(uint256 indexed commitId, address indexed player, bool won, uint256 nftId);
    event Forfeited(uint256 indexed commitId, address indexed player);
    event BlockHashSnapshot(uint256 indexed blockNum, bytes32 blockHash);
    event FreeGranted(address indexed wallet, uint256 amount, uint256 newBalance);
    event FreeRevoked(address indexed wallet, uint256 removed);
    event WinnerSoldBack(uint256 indexed tokenId, address indexed seller, uint256 refund);
    event EmergencyProposed(uint256 indexed nonce, address indexed token, address to, uint256 supplySnapshot);
    event EmergencyVoted(uint256 indexed nonce, address indexed voter, uint256 votesAdded, uint256 yesVotes);
    event EmergencyCancelled(uint256 indexed nonce);
    event EmergencyWithdraw(uint256 indexed nonce, address indexed token, address indexed to, uint256 amount);
    event Paused(bool paused);
    event Round1Closed(uint256 totalWinners, uint256 totalLosers);
    event LpTreasurySet(address indexed treasury);
    event NftStakingSet(address indexed staking);
    event SinkFlushed(address indexed sink, uint256 amount);
    event StakerFlushed(address indexed staking, uint256 amount);
    event WinUsdgWithdrawn(address indexed treasury, uint256 amount);
    event WinnerCapReached();

    constructor(
        address _usdg,
        address _winnerNFT,
        address _loserNFT,
        address _usdgSink,
        address _creator,
        uint256 _mintPrice,
        uint256 _winChanceBp,
        uint256 _revealExtraBlocks
    ) Ownable(msg.sender) {
        require(_usdg != address(0), "zero usdg");
        require(_winnerNFT != address(0) && _loserNFT != address(0), "zero nft");
        require(_usdgSink != address(0), "zero sink");
        require(_creator != address(0), "zero creator");
        require(_mintPrice > 0, "zero price");
        require(_winChanceBp > 0 && _winChanceBp < BP, "bad chance");
        require(_revealExtraBlocks <= 10, "bad reveal delay");

        usdg = IERC20(_usdg);
        winnerNFT = IFingersNFT(_winnerNFT);
        loserNFT = IFingersNFT(_loserNFT);
        usdgSink = _usdgSink;
        creator = _creator;
        mintPrice = _mintPrice;
        winChanceBp = _winChanceBp;
        revealExtraBlocks = _revealExtraBlocks;

        lpTreasury = msg.sender; // default; owner can retarget the WIN-USDG withdrawal
    }

    // ── Round 1: Commit ──────────────────────────────────────

    /// @notice Pay `mintPrice * attempts` USDG and open `attempts` independent mint attempts.
    /// @dev USDG is taken up-front so precomputing the outcome before revealing confers no
    ///      advantage. Each attempt gets its own commit id (its own seed).
    function commit(uint256 attempts) external nonReentrant returns (uint256 firstCommitId) {
        return _commitFor(msg.sender, msg.sender, attempts);
    }

    /// @notice Pay for `attempts` on behalf of `player` (used by the FingersZap so a user can
    ///         enter with any asset). `msg.sender` pays the USDG; `player` owns the attempts
    ///         and any NFTs minted. This can only ever gift an entry, never take one away.
    function commitFor(address player, uint256 attempts) external nonReentrant returns (uint256 firstCommitId) {
        require(player != address(0), "zero player");
        return _commitFor(player, msg.sender, attempts);
    }

    function _commitFor(address player, address payer, uint256 attempts) private returns (uint256 firstCommitId) {
        require(phase == Phase.OPEN, "not open");
        require(!paused, "paused");
        require(attempts >= 1 && attempts <= MAX_BATCH, "bad attempts");
        require(totalWinners < MAX_WINNERS, "winner cap reached");

        uint256 cost = mintPrice * attempts;
        // Charge exactly `cost`; USDG is a standard stablecoin (no fee-on-transfer).
        usdg.safeTransferFrom(payer, address(this), cost);
        totalUsdgCollected += cost;

        firstCommitId = nextCommitId;
        for (uint256 i = 0; i < attempts; i++) {
            _createCommit(player, false);
        }
    }

    /// @notice Open `attempts` FREE mint attempts (no USDG). Each consumes one granted credit;
    ///         the contract owner is unlimited (spends no credits) so the team can seed/marketing-play
    ///         at will. Free wins still count toward the 1,000,000 cap exactly like paid wins — there
    ///         is no guaranteed-winner path, only free rolls at the same 40% odds.
    function commitFree(uint256 attempts) external nonReentrant returns (uint256 firstCommitId) {
        require(phase == Phase.OPEN, "not open");
        require(!paused, "paused");
        require(attempts >= 1 && attempts <= MAX_BATCH, "bad attempts");
        require(totalWinners < MAX_WINNERS, "winner cap reached");

        if (msg.sender != owner()) {
            require(freeCredits[msg.sender] >= attempts, "insufficient credits");
            freeCredits[msg.sender] -= attempts;
        }
        freeCreditsUsed += attempts;

        firstCommitId = nextCommitId;
        for (uint256 i = 0; i < attempts; i++) {
            _createCommit(msg.sender, true);
        }
    }

    function _createCommit(address player, bool free) private returns (uint256 commitId) {
        commitId = nextCommitId++;
        commits[commitId] = Commit({
            player: player,
            commitBlock: uint96(block.number),
            settled: false,
            free: free,
            won: false
        });
        unsettledCommits++;
        totalAttempts++;
        emit Committed(commitId, player, free, block.number);
    }

    // ── Round 1: Reveal ──────────────────────────────────────

    /// @notice Preserve a commit block's hash before it ages out of the 256-block window.
    function snapshotBlockHash(uint256 blockNum) external {
        require(commitBlockHashes[blockNum] == bytes32(0), "already stored");
        bytes32 h = blockhash(blockNum);
        require(h != bytes32(0), "block too old or future");
        commitBlockHashes[blockNum] = h;
        emit BlockHashSnapshot(blockNum, h);
    }

    function _getCommitHash(uint256 commitBlock) private returns (bytes32) {
        bytes32 h = blockhash(commitBlock);
        if (h != bytes32(0)) {
            if (commitBlockHashes[commitBlock] == bytes32(0)) {
                commitBlockHashes[commitBlock] = h;
                emit BlockHashSnapshot(commitBlock, h);
            }
            return h;
        }
        h = commitBlockHashes[commitBlock];
        require(h != bytes32(0), "snapshot block hash first");
        return h;
    }

    /// @notice Settle one attempt: mint a winner or loser NFT to the original committer.
    ///         Callable by anyone (outcome is deterministic once the block hash is known),
    ///         which keeps the game live even if a committer disappears.
    function reveal(uint256 commitId) public nonReentrant returns (bool won, uint256 nftId) {
        return _reveal(commitId);
    }

    function revealBatch(uint256[] calldata commitIds) external nonReentrant {
        uint256 len = commitIds.length;
        require(len > 0 && len <= 100, "bad len");
        for (uint256 i = 0; i < len; i++) {
            _reveal(commitIds[i]);
        }
    }

    function _reveal(uint256 commitId) private returns (bool won, uint256 nftId) {
        Commit storage c = commits[commitId];
        require(c.player != address(0), "no commit");
        require(!c.settled, "settled");
        require(block.number > uint256(c.commitBlock) + revealExtraBlocks, "wait");

        bytes32 h = _getCommitHash(uint256(c.commitBlock));
        bytes32 seed = sha256(abi.encodePacked(h, c.player, commitId));
        won = (uint256(seed) % BP) < winChanceBp;

        // Enforce the hard winner cap: a win past the cap is settled as a loss instead.
        if (won && totalWinners >= MAX_WINNERS) {
            won = false;
        }

        // effects before external mint (reentrancy-safe)
        c.settled = true;
        c.won = won;
        unsettledCommits--;

        address player = c.player;
        uint256 price = c.free ? 0 : mintPrice;

        if (won) {
            totalWinners++;
            winUsdgRetained += price; // WIN money stays for the owner to seed LP / fund sell-backs
            nftId = winnerNFT.mint(player);
            if (price > 0) winnerPaid[nftId] = price; // enables 75% sell-back for paid wins
            if (totalWinners == MAX_WINNERS) emit WinnerCapReached();
        } else {
            totalLosers++;
            _splitLoss(price);
            nftId = loserNFT.mint(player);
        }
        emit Revealed(commitId, player, won, nftId);
    }

    /// @notice Finalize a commit whose block hash aged out (never snapshotted, never revealed).
    ///         Counts as a LOSS with no NFT — a penalty for not revealing in time — and its
    ///         USDG is split like any other loss. Unblocks the settle window. Callable by anyone.
    function forfeit(uint256 commitId) external nonReentrant {
        Commit storage c = commits[commitId];
        require(c.player != address(0), "no commit");
        require(!c.settled, "settled");
        require(block.number > uint256(c.commitBlock) + BLOCKHASH_WINDOW, "too early");
        require(commitBlockHashes[uint256(c.commitBlock)] == bytes32(0), "hash exists, reveal");

        c.settled = true;
        unsettledCommits--;
        totalLosers++;
        _splitLoss(c.free ? 0 : mintPrice);
        emit Forfeited(commitId, c.player);
    }

    /// @dev Earmark a losing attempt's USDG: 25% to stakers, remainder to the sink.
    function _splitLoss(uint256 price) private {
        if (price == 0) return;
        uint256 stakerCut = (price * LOSS_STAKER_BP) / BP;
        uint256 sinkCut = price - stakerCut; // remainder (rounding dust) goes to the sink
        stakerAccrued += stakerCut;
        sinkAccrued += sinkCut;
    }

    // ── USDG bucket routing ──────────────────────────────────

    /// @notice Push the accrued 75%-loss bucket to the immutable sink. Permissionless.
    function flushToSink() external nonReentrant returns (uint256 amount) {
        amount = sinkAccrued;
        require(amount > 0, "nothing");
        sinkAccrued = 0;
        sinkFlushed += amount;
        usdg.safeTransfer(usdgSink, amount);
        emit SinkFlushed(usdgSink, amount);
    }

    /// @notice Push the accrued 25%-loss bucket to the NFT-staking reward stream. Permissionless.
    ///         No-ops-with-revert until `nftStaking` is wired.
    function flushToStaking() external nonReentrant returns (uint256 amount) {
        address staking = nftStaking;
        require(staking != address(0), "staking unset");
        amount = stakerAccrued;
        require(amount > 0, "nothing");
        stakerAccrued = 0;
        stakerFlushed += amount;
        usdg.safeTransfer(staking, amount);
        IFingersNFTStaking(staking).notifyUsdgReward(amount);
        emit StakerFlushed(staking, amount);
    }

    /// @notice Withdraw the retained WIN USDG to `lpTreasury` (for manual LP seeding).
    ///         Touches only the WIN bucket — sink/staker earmarks are never withdrawable here.
    function withdrawWinUsdg() external onlyOwner nonReentrant returns (uint256 amount) {
        amount = winUsdgRetained;
        require(amount > 0, "nothing");
        winUsdgRetained = 0;
        winWithdrawn += amount;
        usdg.safeTransfer(lpTreasury, amount);
        emit WinUsdgWithdrawn(lpTreasury, amount);
    }

    /// @notice Sell a WINNER NFT back to the house for a 75% refund (a 25% loss to the seller).
    ///         The NFT is burned and its buy-back eligibility cleared. Only paid wins qualify
    ///         (free wins paid 0). The refund is paid from the retained WIN bucket, so the owner
    ///         must keep enough there to honor sell-backs (`winUsdgRetained >= refund`). The token
    ///         must be held by the caller — an NFT staked in FingersNFTStaking must be unstaked first.
    function sellBackWinner(uint256 tokenId) external nonReentrant returns (uint256 refund) {
        require(winnerNFT.ownerOf(tokenId) == msg.sender, "not token owner");
        uint256 paid = winnerPaid[tokenId];
        require(paid > 0, "not buyback-eligible");

        refund = (paid * SELLBACK_REFUND_BP) / BP;   // 75% back to seller
        require(winUsdgRetained >= refund, "buyback reserve low");

        // effects before external calls
        winUsdgRetained -= refund;                    // remaining 25% stays as house margin in the WIN bucket
        delete winnerPaid[tokenId];

        winnerNFT.burn(tokenId);                      // game is authorized to burn
        usdg.safeTransfer(msg.sender, refund);
        emit WinnerSoldBack(tokenId, msg.sender, refund);
    }

    // ── Free-attempt allowlist (owner) ───────────────────────

    /// @notice Grant `amount` free-play credits to each wallet (adds to any existing balance).
    ///         Use it for giveaways, quests and partner drops — each credit is one free 40% roll.
    function grantFree(address[] calldata wallets, uint256 amount) external onlyOwner {
        require(amount > 0, "zero amount");
        for (uint256 i = 0; i < wallets.length; i++) {
            address w = wallets[i];
            if (w != address(0)) {
                freeCredits[w] += amount;
                freeCreditsGranted += amount;
                emit FreeGranted(w, amount, freeCredits[w]);
            }
        }
    }

    /// @notice Remove all remaining (unused) free credits from a wallet.
    function revokeFree(address wallet) external onlyOwner {
        uint256 c = freeCredits[wallet];
        require(c > 0, "nothing to revoke");
        freeCredits[wallet] = 0;
        emit FreeRevoked(wallet, c);
    }

    // ── Wiring / transitions (owner) ─────────────────────────

    function setPaused(bool p) external onlyOwner {
        paused = p;
        emit Paused(p);
    }

    /// @notice Retarget where WIN USDG is withdrawn (does not affect the immutable loss sink).
    function setLpTreasury(address treasury) external onlyOwner {
        require(treasury != address(0), "zero");
        lpTreasury = treasury;
        emit LpTreasurySet(treasury);
    }

    /// @notice Bind the NFT-staking contract exactly once (the 25%-loss reward recipient).
    function setNftStaking(address staking) external onlyOwner {
        require(nftStaking == address(0), "already set");
        require(staking != address(0), "zero");
        nftStaking = staking;
        emit NftStakingSet(staking);
    }

    /// @notice Stop accepting new commits. Reveals/forfeits/flushes continue afterwards.
    function closeRound1() external onlyOwner {
        require(phase == Phase.OPEN, "not open");
        phase = Phase.CLOSED;
        emit Round1Closed(totalWinners, totalLosers);
    }

    // ── Emergency withdraw (winner-NFT vote gated) ───────────────

    /// @notice Owner opens an emergency-drain proposal for `token` → `to`. Winner-NFT holders then
    ///         vote; the owner can only execute once YES votes reach 50% of the winner supply
    ///         snapshotted here. Replaces any previous unexecuted proposal (invalidating its votes).
    function proposeEmergency(address token, address to) external onlyOwner {
        require(to != address(0), "zero to");
        require(token != address(0), "zero token");
        uint256 supply = _winnerSupply();
        require(supply > 0, "no electorate");
        emergencyNonce++;
        emergency = Emergency({ token: token, to: to, supplySnapshot: supply, yesVotes: 0, active: true, executed: false });
        emit EmergencyProposed(emergencyNonce, token, to, supply);
    }

    /// @notice Vote YES on the live emergency proposal with winner NFTs you own or have staked.
    ///         Each token votes at most once per proposal.
    function voteEmergency(uint256[] calldata tokenIds) external {
        require(emergency.active && !emergency.executed, "no proposal");
        uint256 n = emergencyNonce;
        uint256 added;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            if (emergencyVoted[n][id]) continue;
            require(_controlsWinner(id, msg.sender), "not your token");
            emergencyVoted[n][id] = true;
            added++;
        }
        require(added > 0, "no new votes");
        emergency.yesVotes += added;
        emit EmergencyVoted(n, msg.sender, added, emergency.yesVotes);
    }

    /// @notice True once the live proposal has reached the 50%-of-winner-supply threshold.
    function emergencyPasses() public view returns (bool) {
        Emergency storage e = emergency;
        return e.active && !e.executed && e.yesVotes * 2 >= e.supplySnapshot;
    }

    /// @notice Owner withdraws the voted-on proposal (only after it passes). Drains the full token
    ///         balance to the destination; for USDG it zeroes all three buckets' accounting.
    function executeEmergency() external onlyOwner nonReentrant returns (uint256 amount) {
        require(emergencyPasses(), "not passed");
        Emergency storage e = emergency;
        address token = e.token;
        address to = e.to;
        e.executed = true;
        e.active = false;

        amount = IERC20(token).balanceOf(address(this));
        require(amount > 0, "nothing");
        if (token == address(usdg)) {
            winUsdgRetained = 0;
            sinkAccrued = 0;
            stakerAccrued = 0;
        }
        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdraw(emergencyNonce, token, to, amount);
    }

    /// @notice Owner scraps the live proposal (e.g. false alarm), invalidating its votes.
    function cancelEmergency() external onlyOwner {
        require(emergency.active && !emergency.executed, "no proposal");
        emergency.active = false;
        emit EmergencyCancelled(emergencyNonce);
    }

    /// @dev Winner electorate size = winner NFTs currently in existence.
    function _winnerSupply() private view returns (uint256) {
        return winnerNFT.totalSupply();
    }

    /// @dev True if `voter` owns `tokenId` directly, or staked it into the NFT-staking contract.
    function _controlsWinner(uint256 tokenId, address voter) private view returns (bool) {
        address holder = winnerNFT.ownerOf(tokenId); // reverts if the token was burned
        if (holder == voter) return true;
        address staking = nftStaking;
        if (staking != address(0) && holder == staking) {
            return IFingersNFTStaking(staking).stakerOf(tokenId) == voter;
        }
        return false;
    }

    // ── Views ────────────────────────────────────────────────

    function getCommit(uint256 commitId) external view returns (Commit memory) {
        return commits[commitId];
    }

    /// @notice Returns true once `commitId` can be revealed (its reveal delay has elapsed).
    function isRevealable(uint256 commitId) external view returns (bool) {
        Commit storage c = commits[commitId];
        if (c.player == address(0) || c.settled) return false;
        return block.number > uint256(c.commitBlock) + revealExtraBlocks;
    }

    /// @notice True once Round 1 is closed and every commit is settled — the winner count
    ///         (and therefore the FingersClaim per-NFT share) is final.
    function isSettled() external view returns (bool) {
        return phase == Phase.CLOSED && unsettledCommits == 0;
    }

    function stats()
        external
        view
        returns (
            Phase _phase,
            uint256 _totalAttempts,
            uint256 _totalWinners,
            uint256 _winnersRemaining,
            uint256 _totalLosers,
            uint256 _unsettledCommits,
            uint256 _totalUsdgCollected,
            uint256 _winUsdgRetained,
            uint256 _sinkAccrued,
            uint256 _stakerAccrued
        )
    {
        return (
            phase,
            totalAttempts,
            totalWinners,
            MAX_WINNERS - totalWinners,
            totalLosers,
            unsettledCommits,
            totalUsdgCollected,
            winUsdgRetained,
            sinkAccrued,
            stakerAccrued
        );
    }
}
