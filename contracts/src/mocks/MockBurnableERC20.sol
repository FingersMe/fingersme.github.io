// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice ERC20 with a public `burn(uint256)` and free `mint` — stands in for $FINGERS
///         (burnable) and basket quote assets in fork tests so the hook's burn path and
///         totalSupply shrink are exercised.
contract MockBurnableERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory n, string memory s, uint8 d) ERC20(n, s) {
        _decimals = d;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
