// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Minimal settable stand-in for FingersNFTStaking.stakedCount used to unit-test
///         FingersStaking's NFT boost without deploying the full NFT/game stack.
contract MockNFTStakeView {
    mapping(address => uint256) public stakedCount;

    function setCount(address user, uint256 count) external {
        stakedCount[user] = count;
    }
}
