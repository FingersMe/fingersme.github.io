// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {LiquidityAmounts} from "@uniswap/v4-periphery/src/libraries/LiquidityAmounts.sol";

interface ISettledGame { function isSettled() external view returns (bool); }

/**
 * @title FingersLPMigrator
 * @notice Creates a Uniswap v4 pool (FINGERS / quote-asset) on Robinhood and adds
 *         full-range liquidity that is PERMANENTLY LOCKED: the position is owned by
 *         this immutable contract, which exposes NO withdraw/collect/decrease path →
 *         liquidity can never be pulled (rug-proof). One shared migrator serves every
 *         FINGERS pair (each basket asset gets its own PoolKey).
 *
 *         Adapted verbatim (logic-identical) from the audited LuckyLaunch2Migrator:
 *         grief-proof initialize (adopts an existing pool's price instead of reverting),
 *         numeric currency sort, full-range add, dust stays locked here.
 *
 * @dev The caller (seeder / owner) transfers `amountToken` FINGERS + `amountQuote` of
 *      the quote asset here first, then calls `graduate`. Pass `hooks` = FingersHook so
 *      the pool is fee-enabled on creation.
 */
contract FingersLPMigrator is IUnlockCallback {
    using SafeERC20 for IERC20;
    using StateLibrary for IPoolManager;
    using PoolIdLibrary for PoolKey;

    IPoolManager public immutable poolManager;

    // ── Auto-LP config (set once by the deployer; then graduation is permissionless) ──
    // Wins accrue as NVDA and are flushed here; the 50M $FINGERS LP allocation is funded here at
    // deploy. Once the game is settled ANYONE can call graduateAuto() to pair the FULL balances into
    // a permanently-locked pool. The team never custodies or withdraws it — the only exit is arbitrage.
    address public admin;            // may configure once; no funds power
    address public autoToken;        // $FINGERS
    address public autoQuote;        // NVDA (payment token)
    address public autoHooks;        // FingersHook
    address public autoGame;         // FingersMe (read isSettled)
    uint24  public autoFee;
    int24   public autoTickSpacing;
    bool    public graduated;        // one-shot

    event AutoConfigured(address token, address quote, address game, uint24 fee, int24 tickSpacing, address hooks);
    event Graduated(uint160 sqrtPriceX96, uint128 liquidity, uint256 amountToken, uint256 amountQuote);

    event Migrated(
        address indexed token,
        address indexed quote,
        uint24 fee,
        int24 tickSpacing,
        uint160 sqrtPriceX96,
        uint128 liquidity
    );

    constructor(address _poolManager) {
        require(_poolManager != address(0), "pm");
        poolManager = IPoolManager(_poolManager);
        admin = msg.sender;
    }

    /// @notice Wire the auto-LP once (deployer). After this, graduation needs no privileged caller.
    function configureAuto(
        address token, address quote, address game,
        uint24 fee, int24 tickSpacing, address hooks
    ) external {
        require(msg.sender == admin, "not admin");
        require(autoToken == address(0), "configured");
        require(token != address(0) && quote != address(0) && game != address(0), "zero");
        autoToken = token; autoQuote = quote; autoGame = game;
        autoFee = fee; autoTickSpacing = tickSpacing; autoHooks = hooks;
        emit AutoConfigured(token, quote, game, fee, tickSpacing, hooks);
    }

    /// @notice PERMISSIONLESS graduation: once the game reports settled, pair the FULL $FINGERS +
    ///         NVDA balances this contract holds into a permanently-locked pool. One-shot. Anyone can
    ///         fire it — the team can never pull the liquidity (no withdraw path exists).
    function graduateAuto() external returns (uint160 sqrtPriceX96, uint128 liquidity) {
        require(autoToken != address(0), "not configured");
        require(!graduated, "graduated");
        require(ISettledGame(autoGame).isSettled(), "raise not settled");
        uint256 amtToken = IERC20(autoToken).balanceOf(address(this));
        uint256 amtQuote = IERC20(autoQuote).balanceOf(address(this));
        require(amtToken > 0 && amtQuote > 0, "empty");
        graduated = true;
        (sqrtPriceX96, liquidity) = _graduate(GraduateParams({
            token: autoToken, quote: autoQuote, fee: autoFee, tickSpacing: autoTickSpacing,
            amountToken: amtToken, amountQuote: amtQuote, hooks: autoHooks
        }));
        emit Graduated(sqrtPriceX96, liquidity, amtToken, amtQuote);
    }

    struct GraduateParams {
        address token;       // FINGERS
        address quote;       // basket asset (WETH / NVDA / meme / USDG ...)
        uint24  fee;
        int24   tickSpacing;
        uint256 amountToken;
        uint256 amountQuote;
        address hooks;       // FingersHook (fee engine)
    }

    struct CallbackData {
        PoolKey key;
        int24 tickLower;
        int24 tickUpper;
        uint160 sqrtPriceX96;
        uint256 amount0;
        uint256 amount1;
    }

    /// @notice Create the v4 pool and add locked full-range liquidity (manual/basket path).
    function graduate(GraduateParams calldata p) external returns (uint160 sqrtPriceX96, uint128 liquidity) {
        return _graduate(p);
    }

    function _graduate(GraduateParams memory p) internal returns (uint160 sqrtPriceX96, uint128 liquidity) {
        (Currency c0, Currency c1, uint256 amount0, uint256 amount1) = p.token < p.quote
            ? (Currency.wrap(p.token), Currency.wrap(p.quote), p.amountToken, p.amountQuote)
            : (Currency.wrap(p.quote), Currency.wrap(p.token), p.amountQuote, p.amountToken);

        PoolKey memory key = PoolKey({
            currency0: c0,
            currency1: c1,
            fee: p.fee,
            tickSpacing: p.tickSpacing,
            hooks: IHooks(p.hooks)
        });

        // GRIEF-PROOF INIT (audit HIGH-1): a public PoolKey lets anyone pre-initialize the
        // pool (gas-only) so a naive initialize() would revert forever and strand funds.
        // If already initialized we ADOPT the current price; the deep locked add + arbitrage
        // correct any griefed opening price. Graduation can never be bricked.
        PoolId id = key.toId();
        (uint160 existing,,,) = poolManager.getSlot0(id);
        if (existing == 0) {
            sqrtPriceX96 = _sqrtPriceFromAmounts(amount0, amount1);
            poolManager.initialize(key, sqrtPriceX96);
        } else {
            sqrtPriceX96 = existing;
        }

        int24 tickLower = (TickMath.MIN_TICK / p.tickSpacing) * p.tickSpacing;
        int24 tickUpper = (TickMath.MAX_TICK / p.tickSpacing) * p.tickSpacing;

        bytes memory ret = poolManager.unlock(abi.encode(CallbackData({
            key: key, tickLower: tickLower, tickUpper: tickUpper,
            sqrtPriceX96: sqrtPriceX96, amount0: amount0, amount1: amount1
        })));
        liquidity = abi.decode(ret, (uint128));

        emit Migrated(p.token, p.quote, p.fee, p.tickSpacing, sqrtPriceX96, liquidity);
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "not pool manager");
        CallbackData memory d = abi.decode(data, (CallbackData));

        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            d.sqrtPriceX96,
            TickMath.getSqrtPriceAtTick(d.tickLower),
            TickMath.getSqrtPriceAtTick(d.tickUpper),
            d.amount0,
            d.amount1
        );
        require(liquidity > 0, "no liquidity");

        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            d.key,
            ModifyLiquidityParams({
                tickLower: d.tickLower,
                tickUpper: d.tickUpper,
                liquidityDelta: int256(uint256(liquidity)),
                salt: bytes32(0)
            }),
            ""
        );

        int128 d0 = delta.amount0();
        int128 d1 = delta.amount1();
        if (d0 < 0) _settle(d.key.currency0, uint256(uint128(-d0)));
        if (d1 < 0) _settle(d.key.currency1, uint256(uint128(-d1)));
        if (d0 > 0) poolManager.take(d.key.currency0, address(this), uint256(uint128(d0)));
        if (d1 > 0) poolManager.take(d.key.currency1, address(this), uint256(uint128(d1)));

        return abi.encode(liquidity);
    }

    function _settle(Currency currency, uint256 amount) internal {
        poolManager.sync(currency);
        IERC20(Currency.unwrap(currency)).safeTransfer(address(poolManager), amount);
        poolManager.settle();
    }

    /// @dev sqrtPriceX96 = sqrt(amount1 / amount0) · 2^96, clamped to the valid range.
    function _sqrtPriceFromAmounts(uint256 amount0, uint256 amount1) internal pure returns (uint160) {
        require(amount0 > 0 && amount1 > 0, "amounts");
        uint256 ratioX192 = FullMath.mulDiv(amount1, uint256(1) << 192, amount0);
        uint256 s = Math.sqrt(ratioX192);
        if (s <= uint256(TickMath.MIN_SQRT_PRICE)) return TickMath.MIN_SQRT_PRICE + 1;
        if (s >= uint256(TickMath.MAX_SQRT_PRICE)) return TickMath.MAX_SQRT_PRICE - 1;
        return uint160(s);
    }
}
