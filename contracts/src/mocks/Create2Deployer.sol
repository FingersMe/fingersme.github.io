// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Minimal CREATE2 deployer used to place the FingersHook at a mined address whose
///         low bits encode the Uniswap-v4 hook permission flags (afterSwap |
///         afterSwapReturnDelta = 0x44). Deploy/test helper only.
contract Create2Deployer {
    event Deployed(address addr, bytes32 salt);

    function deploy(bytes32 salt, bytes calldata code) external returns (address addr) {
        bytes memory c = code;
        assembly {
            addr := create2(0, add(c, 0x20), mload(c), salt)
        }
        require(addr != address(0), "create2 failed");
        emit Deployed(addr, salt);
    }
}
