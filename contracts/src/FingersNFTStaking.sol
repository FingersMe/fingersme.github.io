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

    event Staked(address indexed user, uint256 tokenId);
    event Unstaked(address indexed user, uint256 tokenId);
    event RewardNotified(address indexed token, uint256 amount);
    event Claimed(address indexed token, address indexed user, uint256 amount);
    event RewardTokenRegistered(address indexed token);

    constructor(address _winnerNFT, address _usdg) {
        require(_winnerNFT != address(0), "zero nft");
        require(_usdg != address(0), "zero usdg");
        winnerNFT = IERC721(_winnerNFT);
        usdg = _usdg;
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
        _harvestAll(msg.sender); // pay out everything at the pre-stake share level

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

    /// @notice Claim all pending rewards across every reward token without unstaking.
    function claim() external nonReentrant {
        _harvestAll(msg.sender);
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

    /// @dev Reset a user's debt to the current share level for every reward token.
    function _syncDebt(address user) private {
        uint256 shares = stakedCount[user];
        uint256 n = rewardTokens.length;
        for (uint256 i = 0; i < n; i++) {
            address token = rewardTokens[i];
            rewardDebt[token][user] = (shares * rewards[token].accPerShare) / PRECISION;
        }
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
