// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IFingersMeLike {
    function reveal(uint256 commitId) external returns (bool, uint256);
    function claim(uint256 winnerTokenId) external;
}

/**
 * @notice A contract that receives ERC721 mints and attempts to re-enter FingersMe from
 *         onERC721Received. Used to prove the ReentrancyGuard + CEI ordering holds.
 */
contract ReentrantReceiver is IERC721Receiver {
    IFingersMeLike public game;
    uint256 public reenterCommitId;
    bool public attackReveal;
    bool public reentered;

    function setGame(address g) external {
        game = IFingersMeLike(g);
    }

    function armReveal(uint256 commitId) external {
        attackReveal = true;
        reenterCommitId = commitId;
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        returns (bytes4)
    {
        if (attackReveal) {
            attackReveal = false; // avoid infinite loop
            reentered = true;
            // This should revert inside the guard; swallow so the mint itself isn't blocked
            // when testing non-reentrant paths.
            try game.reveal(reenterCommitId) {} catch {
                reentered = false; // reentry was correctly blocked
            }
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}
