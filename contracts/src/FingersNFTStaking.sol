// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FingersNFTStaking
 * @notice Stake WINNER NFTs to earn the reward streams the ecosystem routes to NFT holders:
 *         primarily the 25%-of-every-loss USDG stream from the FingersMe game, and
 *         (optionally, later) a share of the $FINGERS swap-fee stream from the hook.
 *
 *  ── Weighting ────────────────────────────────────────────────────────────────
 *   Each staked winner NFT is worth exactly ONE share. Rewards are distributed
 *   MasterChef-style by share, so a staker with more NFTs earns proportionally more
 *   ("en fazla NFT stake eden daha fazla pay alır"). Linear-by-count is the fair,
 *   un-gameable weighting; a superlinear curve would just reward wash-splitting.
 *
 *  ── Multi-reward, un-gameable accounting ─────────────────────────────────────
 *   Any ERC20 can be a reward token (USDG now, $FINGERS later). Each stream measures
 *   the REAL balance delta above what it has already accounted, so `notifyReward`
 *   needs no trusted caller and cannot be inflated by a fake `amount`. Rewards that
 *   arrive while nobody is staked are held (`pendingNoStakers`) until the first staker,
 *   so no loss-money is ever stranded.
 *
 *  ── Custody safety ────────────────────────────────────────────────────────────
 *   The contract only ever holds staked NFTs (returnable to their staker) and reward
 *   tokens (owed to stakers). There is no owner/admin path that can move a user's NFT
 *   or seize rewards.
 */
contract FingersNFTStaking is IERC721Receiver, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant PRECISION = 1e18;

    IERC721 public immutable winnerNFT;
    address public immutable usdg;   // the game's 25%-loss reward token (pre-registered)

    struct RewardInfo {
        uint256 accPerShare;      // scaled by PRECISION
        uint256 accounted;        // reward-token balance already folded in
        uint256 pendingNoStakers; // rewards that arrived with zero total stake
        bool    registered;
    }

    address[] public rewardTokens;                  // enumerable set of reward tokens
    mapping(address => RewardInfo) public rewards;   // token => stream state
    mapping(address => mapping(address => uint256)) public rewardDebt; // token => user => debt

    uint256 public totalStaked;                      // total NFTs staked (== total shares)
    mapping(address => uint256) public stakedCount;  // user => number of NFTs staked
    mapping(uint256 => address) public stakerOf;     // tokenId => staker (0 if not staked)

    // ── $FINGERS emission (separate, time-based track) ───────────
    // 50,000,000 $FINGERS is EARNED by staking Winner NFTs over a fixed window that starts once the
    // raise is finalized. It streams at a constant rate, split by staked-NFT count (so each staker's
    // share dilutes as more NFTs stake). Emission that accrues while NOBODY is staked is reserved as
    // `fingersPendingNoStakers` and can be swept by the team (for LP) after the window ends — it is
    // NOT handed to a late staker. This is a separate track from the balance-delta reward set above,
    // so it never interferes with the USDG loss stream.
    uint256 public constant FINGERS_EMISSION = 50_000_000e18;
    address public immutable emissionAdmin;          // may only start emission / sweep leftovers — never touches NFTs or USDG
    IERC20 public fingers;                            // the emission token ($FINGERS)
    uint256 public emissionDuration;                  // configured window length (0 until configured)
    uint256 public fingersRate;                       // $FINGERS per second (0 until started)
    uint256 public fingersEnd;                        // timestamp emission stops
    uint256 public fingersLastAt;                     // last accrual time
    uint256 public fingersRecognized;                 // total $FINGERS accrued so far (≤ FINGERS_EMISSION)
    uint256 public fingersAccPerShare;                // scaled by PRECISION
    uint256 public fingersPendingNoStakers;           // accrued while unstaked → team/LP after end
    mapping(address => uint256) public fingersDebt;   // user => settled level

    // ── Opt-in "double or nothing" on the $FINGERS claim (PvP, self-funded, supply-neutral) ──
    // A staker may GAMBLE their claimable $FINGERS instead of claiming it safely: commit → (a block later)
    // reveal a 50/50 coin flip. WIN pays up to 2× (the bonus comes from the jackpot); LOSE sends the stake
    // INTO the jackpot for future winners — no burn, just redistribution among gamblers. Commit-reveal (a
    // future block hash seeds it) makes it un-exploitable; not revealing within 256 blocks forfeits to the
    // jackpot, so refusing to reveal a loss can never dodge it. The safe `claim()` is always available.
    uint256 public constant GAMBLE_WINDOW = 256;
    uint256 public fingersJackpot;                    // $FINGERS pot funded by losers, drained by winners
    mapping(address => uint256) public gambleAmount;  // $FINGERS a user has put up (0 = none pending)
    mapping(address => uint256) public gambleBlock;   // commit block (its hash seeds the flip)

    event Staked(address indexed user, uint256 tokenId);
    event Unstaked(address indexed user, uint256 tokenId);
    event RewardNotified(address indexed token, uint256 amount);
    event Claimed(address indexed token, address indexed user, uint256 amount);
    event RewardTokenRegistered(address indexed token);
    event FingersEmissionStarted(address indexed fingers, uint256 ratePerSec, uint256 endsAt);
    event FingersLeftoverSwept(address indexed to, uint256 amount);
    event GambleCommitted(address indexed user, uint256 amount, uint256 commitBlock);
    event GambleRevealed(address indexed user, bool won, uint256 amountIn, uint256 payout);

    constructor(address _winnerNFT, address _usdg) {
        require(_winnerNFT != address(0), "zero nft");
        require(_usdg != address(0), "zero usdg");
        winnerNFT = IERC721(_winnerNFT);
        usdg = _usdg;
        emissionAdmin = msg.sender;
        // Pre-register USDG so loss-money that arrives before the first staker is held
        // in pendingNoStakers rather than reverting the game's flush.
        rewards[_usdg].registered = true;
        rewardTokens.push(_usdg);
    }

    // ── Reward intake (permissionless, measured-delta) ───────

    /// @notice Convenience entry used by the FingersMe game for its USDG loss stream.
    ///         The game transfers the USDG in, then calls this; `token` is inferred as
    ///         msg.sender-agnostic — the game passes USDG via the generic path below.
    function notifyUsdgReward(uint256 /*amount*/) external nonReentrant {
        // The game transfers USDG in, then calls here. We fold in whatever actually
        // arrived (measured delta), so the `amount` hint is advisory and un-gameable.
        _notify(usdg);
    }

    /// @notice Fold any reward-token balance that arrived above the accounted amount into
    ///         the stakers' stream. Permissionless and un-gameable (measures real delta).
    function notifyReward(address token) public nonReentrant {
        _notify(token);
    }

    function _notify(address token) private {
        RewardInfo storage r = rewards[token];
        if (!r.registered) {
            r.registered = true;
            rewardTokens.push(token);
            emit RewardTokenRegistered(token);
        }
        uint256 bal = IERC20(token).balanceOf(address(this));
        uint256 fresh = bal - r.accounted;
        if (fresh == 0) return;
        uint256 total = fresh + r.pendingNoStakers;
        if (totalStaked == 0) {
            r.pendingNoStakers = total; // hold until someone stakes
        } else {
            r.accPerShare += (total * PRECISION) / totalStaked;
            r.pendingNoStakers = 0;
        }
        r.accounted = bal;
        emit RewardNotified(token, fresh);
    }

    // ── Stake / unstake ──────────────────────────────────────

    function stake(uint256[] calldata tokenIds) external nonReentrant {
        uint256 len = tokenIds.length;
        require(len > 0, "empty");
        _startEmission();              // first stake auto-starts the 90-day $FINGERS emission
        _harvestAll(msg.sender);       // pay out USDG at the pre-stake share level
        _harvestFingers(msg.sender);   // pay out $FINGERS emission at the pre-stake share level

        for (uint256 i = 0; i < len; i++) {
            uint256 id = tokenIds[i];
            // Pull the NFT in; ownership check is enforced by transferFrom.
            winnerNFT.safeTransferFrom(msg.sender, address(this), id);
            stakerOf[id] = msg.sender;
            emit Staked(msg.sender, id);
        }
        stakedCount[msg.sender] += len;
        totalStaked += len;
        _syncDebt(msg.sender);
    }

    function unstake(uint256[] calldata tokenIds) external nonReentrant {
        uint256 len = tokenIds.length;
        require(len > 0, "empty");
        require(len <= stakedCount[msg.sender], "too many");
        _harvestAll(msg.sender);
        _harvestFingers(msg.sender);

        for (uint256 i = 0; i < len; i++) {
            uint256 id = tokenIds[i];
            require(stakerOf[id] == msg.sender, "not staker");
            stakerOf[id] = address(0);
            winnerNFT.safeTransferFrom(address(this), msg.sender, id);
            emit Unstaked(msg.sender, id);
        }
        stakedCount[msg.sender] -= len;
        totalStaked -= len;
        _syncDebt(msg.sender);
    }

    /// @notice Claim all pending rewards (USDG streams + $FINGERS emission) without unstaking.
    function claim() external nonReentrant {
        _harvestAll(msg.sender);
        _harvestFingers(msg.sender);
        _syncDebt(msg.sender);
    }

    // ── Internal reward settlement ───────────────────────────

    function _harvestAll(address user) private {
        uint256 shares = stakedCount[user];
        uint256 n = rewardTokens.length;
        for (uint256 i = 0; i < n; i++) {
            address token = rewardTokens[i];
            _notify(token); // fold in fresh rewards first
            if (shares == 0) continue;
            RewardInfo storage r = rewards[token];
            uint256 owed = (shares * r.accPerShare) / PRECISION - rewardDebt[token][user];
            if (owed > 0) {
                r.accounted -= owed;
                IERC20(token).safeTransfer(user, owed);
                emit Claimed(token, user, owed);
            }
        }
    }

    /// @dev Reset a user's debt to the current share level for every reward token + the emission.
    function _syncDebt(address user) private {
        uint256 shares = stakedCount[user];
        uint256 n = rewardTokens.length;
        for (uint256 i = 0; i < n; i++) {
            address token = rewardTokens[i];
            rewardDebt[token][user] = (shares * rewards[token].accPerShare) / PRECISION;
        }
        fingersDebt[user] = (shares * fingersAccPerShare) / PRECISION;
    }

    // ── $FINGERS emission ────────────────────────────────────

    /// @notice Configure the 50M $FINGERS emission window (admin, once, requires the 50M already funded).
    ///         This does NOT start the clock — emission auto-starts on the FIRST stake, so there is no
    ///         manual launch step. (An admin fallback `startFingersEmission()` exists in case nobody stakes.)
    function configureEmission(address _fingers, uint256 duration) external {
        require(msg.sender == emissionAdmin, "not admin");
        require(emissionDuration == 0, "configured");
        require(_fingers != address(0), "zero token");
        require(duration >= 1 days && duration <= 365 days, "bad duration");
        require(IERC20(_fingers).balanceOf(address(this)) >= FINGERS_EMISSION, "underfunded");
        fingers = IERC20(_fingers);
        emissionDuration = duration;
    }

    /// @notice Admin fallback to start the configured emission manually (e.g. if nobody has staked yet).
    function startFingersEmission() external {
        require(msg.sender == emissionAdmin, "not admin");
        _startEmission();
    }

    /// @dev Begin the emission clock (idempotent). Fires automatically on the first stake.
    function _startEmission() private {
        if (fingersRate != 0 || emissionDuration == 0) return;
        fingersRate = FINGERS_EMISSION / emissionDuration; // integer-division dust stays sweepable
        fingersEnd = block.timestamp + emissionDuration;
        fingersLastAt = block.timestamp;
        emit FingersEmissionStarted(address(fingers), fingersRate, fingersEnd);
    }

    /// @notice After the emission window ends, sweep to `to` (team LP reserve) ONLY the $FINGERS that
    ///         was never owed to a staker: emission that accrued while nobody was staked, plus the
    ///         integer-division dust that was never emitted. It provably never touches staker balances
    ///         (those live in accPerShare and are claimable forever).
    function sweepFingersLeftover(address to) external nonReentrant returns (uint256 amount) {
        require(msg.sender == emissionAdmin, "not admin");
        require(fingersEnd != 0 && block.timestamp > fingersEnd, "not ended");
        require(to != address(0), "zero to");
        _accrueFingers(); // finalize recognition up to `end`
        uint256 dust = FINGERS_EMISSION - fingersRecognized; // never-emitted division remainder
        amount = fingersPendingNoStakers + dust;
        require(amount > 0, "nothing");
        fingersPendingNoStakers = 0;
        fingersRecognized = FINGERS_EMISSION; // mark the dust consumed so it can't be swept twice
        fingers.safeTransfer(to, amount);
        emit FingersLeftoverSwept(to, amount);
    }

    /// @dev Recognize elapsed emission: route to stakers (accPerShare) or hold for the team (noStakers).
    function _accrueFingers() private {
        uint256 rate = fingersRate;
        if (rate == 0) return;
        uint256 end = fingersEnd;
        uint256 nowT = block.timestamp < end ? block.timestamp : end;
        uint256 last = fingersLastAt;
        if (nowT <= last) return;
        uint256 amount = (nowT - last) * rate;
        uint256 remaining = FINGERS_EMISSION - fingersRecognized;
        if (amount > remaining) amount = remaining;
        fingersLastAt = nowT;
        if (amount == 0) return;
        fingersRecognized += amount;
        if (totalStaked == 0) {
            fingersPendingNoStakers += amount;       // reserved for team/LP
        } else {
            fingersAccPerShare += (amount * PRECISION) / totalStaked;
        }
    }

    /// @dev Settle a user's accrued $FINGERS at the current share level.
    function _harvestFingers(address user) private {
        _accrueFingers();
        uint256 shares = stakedCount[user];
        if (shares == 0) return;
        uint256 owed = (shares * fingersAccPerShare) / PRECISION - fingersDebt[user];
        if (owed > 0) {
            fingers.safeTransfer(user, owed);
            emit Claimed(address(fingers), user, owed);
        }
    }

    /// @notice A staker's currently-claimable $FINGERS emission.
    function pendingFingers(address user) external view returns (uint256) {
        uint256 acc = fingersAccPerShare;
        uint256 rate = fingersRate;
        if (rate != 0 && totalStaked > 0) {
            uint256 nowT = block.timestamp < fingersEnd ? block.timestamp : fingersEnd;
            if (nowT > fingersLastAt) {
                uint256 amount = (nowT - fingersLastAt) * rate;
                uint256 remaining = FINGERS_EMISSION - fingersRecognized;
                if (amount > remaining) amount = remaining;
                acc += (amount * PRECISION) / totalStaked;
            }
        }
        return (stakedCount[user] * acc) / PRECISION - fingersDebt[user];
    }

    // ── Double-or-nothing on the $FINGERS claim (opt-in, commit-reveal) ──

    /// @notice Put your claimable $FINGERS up for a 50/50 double-or-nothing. Settles it out of the
    ///         emission accounting and escrows it until you reveal. One live gamble per wallet.
    function gambleClaimCommit() external nonReentrant returns (uint256 amount) {
        require(gambleAmount[msg.sender] == 0, "gamble pending");
        _accrueFingers();
        uint256 shares = stakedCount[msg.sender];
        require(shares > 0, "no stake");
        uint256 owed = (shares * fingersAccPerShare) / PRECISION - fingersDebt[msg.sender];
        require(owed > 0, "nothing to gamble");
        fingersDebt[msg.sender] += owed;                 // remove it from claimable (escrowed for the flip)
        gambleAmount[msg.sender] = owed;
        gambleBlock[msg.sender] = block.number;
        amount = owed;
        emit GambleCommitted(msg.sender, owed, block.number);
    }

    /// @notice Reveal the flip (a block after commit). WIN → up to 2× (bonus from the jackpot);
    ///         LOSE → your stake feeds the jackpot. Must reveal within 256 blocks (else forfeit).
    function gambleClaimReveal() external nonReentrant returns (bool won, uint256 payout) {
        uint256 amt = gambleAmount[msg.sender];
        require(amt > 0, "no gamble");
        uint256 cb = gambleBlock[msg.sender];
        require(block.number > cb, "wait a block");
        bytes32 h = blockhash(cb);
        require(h != bytes32(0), "aged out");            // reveal within the 256-block window
        gambleAmount[msg.sender] = 0;                     // effects before transfer (CEI)
        gambleBlock[msg.sender] = 0;
        won = uint256(sha256(abi.encodePacked(h, msg.sender, amt))) % 2 == 0;
        if (won) {
            uint256 bonus = amt < fingersJackpot ? amt : fingersJackpot; // up to 2×, capped by the pot
            fingersJackpot -= bonus;
            payout = amt + bonus;
            fingers.safeTransfer(msg.sender, payout);
        } else {
            fingersJackpot += amt;                        // your stake joins the pot for future winners
        }
        emit GambleRevealed(msg.sender, won, amt, payout);
    }

    /// @notice If a gambler never reveals within the window, ANYONE can forfeit their stake to the
    ///         jackpot — so not revealing a loss can never dodge it. Keeps the game un-exploitable.
    function gambleForfeit(address user) external nonReentrant {
        uint256 amt = gambleAmount[user];
        require(amt > 0, "no gamble");
        require(block.number > gambleBlock[user] + GAMBLE_WINDOW, "not aged");
        require(blockhash(gambleBlock[user]) == bytes32(0), "still revealable");
        gambleAmount[user] = 0;
        gambleBlock[user] = 0;
        fingersJackpot += amt;
        emit GambleRevealed(user, false, amt, 0);
    }

    /// @notice A user's live gamble (amount, commit block, whether it can be revealed now).
    function pendingGamble(address user) external view returns (uint256 amount, uint256 commitBlock, bool revealable) {
        amount = gambleAmount[user];
        commitBlock = gambleBlock[user];
        revealable = amount > 0 && block.number > commitBlock && blockhash(commitBlock) != bytes32(0);
    }

    /// @notice Emission snapshot for the UI: rate/sec, end ts, seconds left, distributed, total.
    function fingersEmissionInfo() external view returns (uint256 rate, uint256 endsAt, uint256 secsLeft, uint256 recognized, uint256 total) {
        rate = fingersRate;
        endsAt = fingersEnd;
        secsLeft = block.timestamp >= fingersEnd ? 0 : fingersEnd - block.timestamp;
        recognized = fingersRecognized;
        total = FINGERS_EMISSION;
    }

    // ── Views ────────────────────────────────────────────────

    function rewardTokenCount() external view returns (uint256) {
        return rewardTokens.length;
    }

    function pending(address token, address user) external view returns (uint256) {
        RewardInfo storage r = rewards[token];
        uint256 acc = r.accPerShare;
        if (totalStaked > 0) {
            uint256 bal = IERC20(token).balanceOf(address(this));
            uint256 fresh = bal - r.accounted + r.pendingNoStakers;
            acc += (fresh * PRECISION) / totalStaked;
        }
        return (stakedCount[user] * acc) / PRECISION - rewardDebt[token][user];
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
