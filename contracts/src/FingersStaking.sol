// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface INFTStakeView {
    function stakedCount(address user) external view returns (uint256);
}

/**
 * @title FingersStaking
 * @notice Stake $FINGERS to earn $FINGERS from the hook's swap-fee stream. A staker's
 *         reward weight is BOOSTED by how many winner NFTs they have staked in
 *         FingersNFTStaking, on top of their staked amount — so the returning fee rewards
 *         both "how much you stake" and "how many NFTs you stake" ("en fazla NFT stake
 *         eden dönen fee'de daha fazla pay alır").
 *
 *  ── Boosted MasterChef ────────────────────────────────────────────────────────
 *   effWeight = amount · (BP + boost) / BP,  boost = min(maxBoostBP, nftCount · nftBoostBP).
 *   Rewards accrue over the SUM of effWeights. Because a user's NFT count can change in the
 *   other contract without notifying this one, the boost used is the value at the user's
 *   last interaction; anyone can refresh their own via `syncBoost()` (settles first, so it
 *   can never retro-credit). Bounds are hard-capped and owner-tunable within them only.
 *
 *  ── Un-gameable accounting ────────────────────────────────────────────────────
 *   Stake token == reward token == $FINGERS. Reward inflow is measured as the balance
 *   delta above the accounted amount (principal + already-folded rewards), so
 *   `notifyReward` needs no trusted caller and a fake `amount` cannot inflate it. Rewards
 *   that arrive with zero stake are held (`pendingNoStakers`) until the first staker.
 *   No owner path can move a user's principal or seize rewards.
 */
contract FingersStaking is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant BP = 10000;
    uint256 private constant PRECISION = 1e18;

    // Hard caps the owner can never exceed.
    uint256 public constant MAX_NFT_BOOST_BP = 500;    // ≤ +5% weight per staked NFT
    uint256 public constant MAX_TOTAL_BOOST_BP = 50000; // ≤ +500% total boost

    IERC20 public immutable fingers;
    INFTStakeView public immutable nftStaking;

    address public owner;
    uint256 public nftBoostBP = 100;     // +1% weight per staked NFT (tunable ≤ MAX_NFT_BOOST_BP)
    uint256 public maxBoostBP = 20000;   // +200% cap (tunable ≤ MAX_TOTAL_BOOST_BP)
    uint256 public minHold = 3 days;     // hold ≥ this to avoid the early-exit forfeit
    uint256 public earlyExitBP = 5000;   // ≤ this share of pending forfeited if leaving early

    uint256 public accRewardPerShare; // scaled 1e18, over totalEffWeight
    uint256 public accounted;         // FINGERS balance already known (principal + folded rewards)
    uint256 public pendingNoStakers;  // rewards that arrived with zero total weight
    uint256 public totalStaked;       // sum of principal
    uint256 public totalEffWeight;    // sum of effective (boosted) weights

    struct UserInfo {
        uint256 amount;     // FINGERS principal
        uint256 effWeight;  // boosted weight currently counted
        uint256 rewardDebt;
        uint64  stakeTime;
    }
    mapping(address => UserInfo) public userInfo;

    event Staked(address indexed user, uint256 amount, uint256 effWeight);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 forfeited);
    event Claimed(address indexed user, uint256 reward);
    event BoostSynced(address indexed user, uint256 effWeight);
    event RewardNotified(address indexed token, uint256 amount);
    event ParamsUpdated(uint256 nftBoostBP, uint256 maxBoostBP, uint256 minHold, uint256 earlyExitBP);

    constructor(address _fingers, address _nftStaking) {
        require(_fingers != address(0) && _nftStaking != address(0), "zero");
        fingers = IERC20(_fingers);
        nftStaking = INFTStakeView(_nftStaking);
        owner = msg.sender;
    }

    // ── Reward intake (permissionless, measured-delta) ───────

    /// @notice Called by the hook after it transfers a $FINGERS reward in. `token` must be
    ///         $FINGERS; the amount is measured, not trusted.
    function notifyReward(address token, uint256 /*hint*/) public {
        require(token == address(fingers), "token");
        _fold();
    }

    function _fold() private {
        uint256 bal = fingers.balanceOf(address(this));
        uint256 fresh = bal - accounted;
        if (fresh == 0) return;
        uint256 total = fresh + pendingNoStakers;
        if (totalEffWeight == 0) {
            pendingNoStakers = total;
        } else {
            accRewardPerShare += (total * PRECISION) / totalEffWeight;
            pendingNoStakers = 0;
        }
        accounted = bal;
        emit RewardNotified(address(fingers), fresh);
    }

    // ── Boost math ───────────────────────────────────────────

    function boostBPOf(address user) public view returns (uint256) {
        uint256 b = nftStaking.stakedCount(user) * nftBoostBP;
        return b > maxBoostBP ? maxBoostBP : b;
    }

    function _effWeight(address user, uint256 amount) private view returns (uint256) {
        return (amount * (BP + boostBPOf(user))) / BP;
    }

    // ── Stake / unstake / claim ──────────────────────────────

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "amount");
        _fold();
        UserInfo storage u = userInfo[msg.sender];
        _payPending(u);

        uint256 before = fingers.balanceOf(address(this));
        fingers.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = fingers.balanceOf(address(this)) - before; // (FINGERS is not fee-on-transfer, but measure anyway)

        u.amount += received;
        totalStaked += received;
        u.stakeTime = uint64(block.timestamp);
        accounted += received;
        _resetWeight(msg.sender, u);
        emit Staked(msg.sender, received, u.effWeight);
    }

    function unstake(uint256 amount) external nonReentrant {
        UserInfo storage u = userInfo[msg.sender];
        require(amount > 0 && amount <= u.amount, "amount");
        _fold();

        uint256 owed = (u.effWeight * accRewardPerShare) / PRECISION - u.rewardDebt;

        // Loyalty: leaving before minHold forfeits a bounded share of pending, redistributed
        // to the stakers who remain.
        uint256 forfeited;
        uint256 effAfterOthers = totalEffWeight - u.effWeight;
        if (block.timestamp < u.stakeTime + minHold && owed > 0 && effAfterOthers > 0) {
            forfeited = (owed * earlyExitBP) / BP;
            owed -= forfeited;
            accRewardPerShare += (forfeited * PRECISION) / effAfterOthers;
        }

        u.amount -= amount;
        totalStaked -= amount;

        uint256 out = amount + owed;
        accounted -= out;
        _resetWeight(msg.sender, u);
        if (out > 0) fingers.safeTransfer(msg.sender, out);
        emit Unstaked(msg.sender, amount, owed, forfeited);
    }

    function claim() external nonReentrant {
        UserInfo storage u = userInfo[msg.sender];
        _fold();
        _payPending(u);
        _resetWeight(msg.sender, u);
    }

    /// @notice Refresh your boost after changing your staked-NFT count. Settles first, so it
    ///         only affects rewards going forward (never retroactively).
    function syncBoost() external nonReentrant {
        UserInfo storage u = userInfo[msg.sender];
        _fold();
        _payPending(u);
        _resetWeight(msg.sender, u);
        emit BoostSynced(msg.sender, u.effWeight);
    }

    function _payPending(UserInfo storage u) private {
        if (u.effWeight == 0) return;
        uint256 owed = (u.effWeight * accRewardPerShare) / PRECISION - u.rewardDebt;
        if (owed > 0) {
            accounted -= owed;
            fingers.safeTransfer(msg.sender, owed);
            emit Claimed(msg.sender, owed);
        }
    }

    /// @dev Recompute the user's effective weight from current principal + current boost,
    ///      keeping totalEffWeight in sync, and reset debt to the current level.
    function _resetWeight(address user, UserInfo storage u) private {
        uint256 newEff = _effWeight(user, u.amount);
        totalEffWeight = totalEffWeight - u.effWeight + newEff;
        u.effWeight = newEff;
        u.rewardDebt = (newEff * accRewardPerShare) / PRECISION;
    }

    // ── Views ────────────────────────────────────────────────

    function pending(address user) external view returns (uint256) {
        UserInfo storage u = userInfo[user];
        uint256 acc = accRewardPerShare;
        if (totalEffWeight > 0) {
            uint256 bal = fingers.balanceOf(address(this));
            uint256 fresh = bal - accounted + pendingNoStakers;
            acc += (fresh * PRECISION) / totalEffWeight;
        }
        return (u.effWeight * acc) / PRECISION - u.rewardDebt;
    }

    // ── Bounded admin (params only; never touches user funds) ──

    function setParams(uint256 _nftBoostBP, uint256 _maxBoostBP, uint256 _minHold, uint256 _earlyExitBP) external {
        require(msg.sender == owner, "owner");
        require(_nftBoostBP <= MAX_NFT_BOOST_BP && _maxBoostBP <= MAX_TOTAL_BOOST_BP, "boost bounds");
        require(_minHold <= 30 days && _earlyExitBP <= BP, "bounds");
        nftBoostBP = _nftBoostBP;
        maxBoostBP = _maxBoostBP;
        minHold = _minHold;
        earlyExitBP = _earlyExitBP;
        emit ParamsUpdated(_nftBoostBP, _maxBoostBP, _minHold, _earlyExitBP);
    }

    function transferOwnership(address o) external { require(msg.sender == owner, "owner"); require(o != address(0), "zero"); owner = o; }
}
