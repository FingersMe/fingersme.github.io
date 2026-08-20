// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFingersGame {
    function isSettled() external view returns (bool);
    function totalWinners() external view returns (uint256);
}

interface IWinnerNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title FingersClaim
 * @notice Distributes the 50,000,000 $FINGERS claim allocation to winner-NFT holders,
 *         pro-rata by NFT: each winner NFT can claim an equal `perNFTShare`. Because a
 *         bigger winner simply holds more winner NFTs, "en çok kazanan daha çok alır"
 *         falls out automatically — no gameable on-chain leaderboard needed.
 *
 *  ── Non-destructive claim ─────────────────────────────────────────────────────
 *   Claiming does NOT burn the NFT — it flips a one-time `claimed[tokenId]` flag — so a
 *   winner keeps the NFT to STAKE it in FingersNFTStaking afterwards. Selling a claimed
 *   NFT carries no second claim (the flag is per tokenId, not per holder).
 *
 *  ── Solvency ──────────────────────────────────────────────────────────────────
 *   `open()` freezes `winnerLockCount` only once the game reports every commit settled,
 *   so the winner set — and therefore `perNFTShare = balance / winnerLockCount` — is
 *   final and the distribution is always fully funded. Only integer-division dust above
 *   the outstanding obligation can be swept.
 */
contract FingersClaim is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IFingersGame public immutable game;
    IWinnerNFT public immutable winnerNFT;
    IERC20 public immutable fingers;

    bool public opened;
    uint256 public winnerLockCount; // winner count frozen at open()
    uint256 public perNFTShare;     // $FINGERS per winner NFT
    uint256 public totalClaimed;    // winner NFTs claimed so far

    mapping(uint256 => bool) public claimed; // tokenId => claimed

    event Opened(uint256 winnerLockCount, uint256 perNFTShare, uint256 pool);
    event Claimed(address indexed holder, uint256 indexed tokenId, uint256 amount);
    event DustSwept(address indexed to, uint256 amount);

    constructor(address _game, address _winnerNFT, address _fingers) Ownable(msg.sender) {
        require(_game != address(0) && _winnerNFT != address(0) && _fingers != address(0), "zero");
        game = IFingersGame(_game);
        winnerNFT = IWinnerNFT(_winnerNFT);
        fingers = IERC20(_fingers);
    }

    /// @notice Freeze the winner count and per-NFT share. Requires the game fully settled
    ///         and this contract already funded with the $FINGERS claim allocation.
    function open() external onlyOwner {
        require(!opened, "opened");
        require(game.isSettled(), "game not settled");
        uint256 winners = game.totalWinners();
        require(winners > 0, "no winners");
        uint256 pool = fingers.balanceOf(address(this));
        require(pool >= winners, "underfunded");

        winnerLockCount = winners;
        perNFTShare = pool / winners; // integer split; dust sweepable later
        opened = true;
        emit Opened(winners, perNFTShare, pool);
    }

    /// @notice Claim the $FINGERS share for one winner NFT you currently hold.
    function claim(uint256 tokenId) external nonReentrant {
        _claim(tokenId);
        fingers.safeTransfer(msg.sender, perNFTShare);
    }

    /// @notice Claim for many winner NFTs at once (all must be held by msg.sender).
    function claimMany(uint256[] calldata tokenIds) external nonReentrant {
        uint256 len = tokenIds.length;
        require(len > 0 && len <= 200, "bad len");
        for (uint256 i = 0; i < len; i++) {
            _claim(tokenIds[i]);
        }
        fingers.safeTransfer(msg.sender, perNFTShare * len);
    }

    function _claim(uint256 tokenId) private {
        require(opened, "not open");
        require(!claimed[tokenId], "claimed");
        require(winnerNFT.ownerOf(tokenId) == msg.sender, "not owner");
        require(tokenId < winnerLockCount, "not a locked winner");
        claimed[tokenId] = true;
        totalClaimed++;
        emit Claimed(msg.sender, tokenId, perNFTShare);
    }

    /// @notice Sweep only the dust above the outstanding claim obligation. Never touches
    ///         $FINGERS still owed to winners who haven't claimed yet.
    function sweepDust(address to) external onlyOwner nonReentrant {
        require(opened && to != address(0), "bad");
        uint256 outstanding = (winnerLockCount - totalClaimed) * perNFTShare;
        uint256 bal = fingers.balanceOf(address(this));
        require(bal > outstanding, "nothing");
        uint256 dust = bal - outstanding;
        fingers.safeTransfer(to, dust);
        emit DustSwept(to, dust);
    }

    // ── Views ────────────────────────────────────────────────

    function isClaimable(uint256 tokenId) external view returns (bool) {
        return opened && !claimed[tokenId] && tokenId < winnerLockCount;
    }
}
