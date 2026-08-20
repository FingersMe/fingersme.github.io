// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

interface IFingersGameZap {
    function usdg() external view returns (address);
    function mintPrice() external view returns (uint256);
    function commitFor(address player, uint256 attempts) external returns (uint256);
    function MAX_BATCH() external view returns (uint256);
}

/**
 * @title FingersZap — enter the game paying with ANY asset
 * @notice Lets a player buy mint attempts with WETH / an RWA (NVDA…) / a memecoin instead
 *         of USDG: the zap swaps `tokenIn` -> USDG through a caller-supplied v4 pool, works
 *         out how many whole attempts that USDG buys, commits them FOR the player via the
 *         game's `commitFor`, and refunds the USDG remainder. So "pay with WETH but it
 *         counts as USDG" — while the game core stays strictly USDG-denominated.
 *
 *  ── Why this is safe ──────────────────────────────────────────────────────────
 *   The price oracle stays OUT of the game's critical path (an oracle there would let an
 *   attacker mint cheaply). The conversion is a plain swap of the USER's OWN funds, bounded
 *   by their `minUsdgOut`; a bad/sandwiched route only reduces how many attempts THEY get,
 *   never the protocol's solvency. The zap custodies nothing between calls.
 */
contract FingersZap is IUnlockCallback, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IPoolManager public immutable poolManager;
    IFingersGameZap public immutable game;
    IERC20 public immutable usdg;

    event Zapped(address indexed player, address indexed tokenIn, uint256 amountIn, uint256 usdgOut, uint256 attempts, uint256 refund);

    constructor(address _poolManager, address _game) {
        require(_poolManager != address(0) && _game != address(0), "zero");
        poolManager = IPoolManager(_poolManager);
        game = IFingersGameZap(_game);
        usdg = IERC20(IFingersGameZap(_game).usdg());
    }

    struct Route {
        address tokenIn;
        uint24  fee;
        int24   tickSpacing;
        address hooks;
    }

    /// @notice Swap `amountIn` of `route.tokenIn` to USDG, then commit as many whole attempts
    ///         as that buys for `msg.sender`. Reverts if it can't afford at least one attempt.
    /// @param minUsdgOut slippage floor for the swap (protects the caller).
    function zapCommit(Route calldata route, uint256 amountIn, uint256 minUsdgOut)
        external
        nonReentrant
        returns (uint256 attempts, uint256 usdgOut, uint256 refund)
    {
        require(route.tokenIn != address(usdg), "use commit()");
        require(amountIn > 0, "amount");

        IERC20(route.tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        bytes memory ret = poolManager.unlock(abi.encode(route, amountIn));
        usdgOut = abi.decode(ret, (uint256));
        require(usdgOut >= minUsdgOut, "slippage");

        uint256 price = game.mintPrice();
        uint256 maxBatch = game.MAX_BATCH();
        attempts = usdgOut / price;
        require(attempts >= 1, "insufficient for 1 attempt");
        if (attempts > maxBatch) attempts = maxBatch; // one commit tx is capped; refund the rest

        uint256 cost = attempts * price;
        usdg.forceApprove(address(game), cost);
        game.commitFor(msg.sender, attempts);

        refund = usdgOut - cost;
        if (refund > 0) usdg.safeTransfer(msg.sender, refund);
        // Reset any residual allowance.
        usdg.forceApprove(address(game), 0);

        emit Zapped(msg.sender, route.tokenIn, amountIn, usdgOut, attempts, refund);
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "not pm");
        (Route memory route, uint256 amountIn) = abi.decode(data, (Route, uint256));

        address tokenIn = route.tokenIn;
        address out = address(usdg);
        (Currency c0, Currency c1) = tokenIn < out
            ? (Currency.wrap(tokenIn), Currency.wrap(out))
            : (Currency.wrap(out), Currency.wrap(tokenIn));

        PoolKey memory key = PoolKey({
            currency0: c0,
            currency1: c1,
            fee: route.fee,
            tickSpacing: route.tickSpacing,
            hooks: IHooks(route.hooks)
        });

        bool zeroForOne = Currency.unwrap(c0) == tokenIn; // selling tokenIn for USDG
        BalanceDelta delta = poolManager.swap(
            key,
            SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(amountIn), // exact input
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            ""
        );

        int128 d0 = delta.amount0();
        int128 d1 = delta.amount1();
        uint256 usdgOut;
        if (d0 < 0) _settle(c0, uint256(uint128(-d0)));
        if (d1 < 0) _settle(c1, uint256(uint128(-d1)));
        if (d0 > 0) { poolManager.take(c0, address(this), uint256(uint128(d0))); if (Currency.unwrap(c0) == out) usdgOut = uint256(uint128(d0)); }
        if (d1 > 0) { poolManager.take(c1, address(this), uint256(uint128(d1))); if (Currency.unwrap(c1) == out) usdgOut = uint256(uint128(d1)); }

        return abi.encode(usdgOut);
    }

    function _settle(Currency currency, uint256 amount) internal {
        poolManager.sync(currency);
        IERC20(Currency.unwrap(currency)).safeTransfer(address(poolManager), amount);
        poolManager.settle();
    }
}
