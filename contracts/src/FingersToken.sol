// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title FingersToken — "Fingers" ($FINGERS)
 * @notice The launch ERC20 for the Fingers Me ecosystem.
 *
 *  ── Supply model (immutable) ─────────────────────────────────────────────
 *   Fixed MAX_SUPPLY = 100,000,000 * 1e18, minted EXACTLY ONCE in the constructor,
 *   split between two recipients and NEVER inflated afterwards (there is no mint path):
 *     • LP_ALLOCATION    (50,000,000) -> `lpTreasury`  : seeded manually into the locked
 *                                                        UniV4 pool (Fingers paired with the
 *                                                        RWA/meme basket) by the team.
 *     • CLAIM_ALLOCATION (50,000,000) -> `claimVault`  : distributed by the FingersClaim
 *                                                        contract to winner-NFT holders,
 *                                                        pro-rata (more NFTs won => more $FINGERS).
 *
 *  ── Fee model ────────────────────────────────────────────────────────────
 *   $FINGERS is a PLAIN ERC20 (no transfer tax): wallet-to-wallet moves are free and it
 *   stays fully composable. The 1% buy/sell fee is enforced at the pool level by the UniV4
 *   hook (FingersHook), so only trades against the hooked pool are charged — normal
 *   transfers, staking deposits and LP operations are not double-taxed.
 *
 *  ── Deflation ─────────────────────────────────────────────────────────────
 *   Burnable (ERC20Burnable): the hook's buyback-and-burn and burn-share reduce totalSupply
 *   over time. Anyone can only ever burn their own balance.
 */
contract FingersToken is ERC20, ERC20Burnable {
    uint256 public constant MAX_SUPPLY = 100_000_000 ether;
    uint256 public constant LP_ALLOCATION = 50_000_000 ether;
    uint256 public constant CLAIM_ALLOCATION = 50_000_000 ether;

    /// @param lpTreasury  receives the 50M LP allocation (team wallet that seeds the locked pool)
    /// @param claimVault  receives the 50M claim allocation (the FingersClaim distributor contract)
    constructor(address lpTreasury, address claimVault) ERC20("Fingers", "FINGERS") {
        require(lpTreasury != address(0) && claimVault != address(0), "zero recipient");
        // MAX_SUPPLY == LP_ALLOCATION + CLAIM_ALLOCATION (checked by construction below).
        _mint(lpTreasury, LP_ALLOCATION);
        _mint(claimVault, CLAIM_ALLOCATION);
        // Sanity: the entire fixed supply is now minted and no mint path remains.
        assert(totalSupply() == MAX_SUPPLY);
    }
}
