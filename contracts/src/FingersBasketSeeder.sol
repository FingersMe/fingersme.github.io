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
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {LiquidityAmounts} from "@uniswap/v4-periphery/src/libraries/LiquidityAmounts.sol";

interface IBurnableToken {
    function burn(uint256 value) external;
}

interface IFingersHookRegistrar {
    struct PoolCfg {
        bool    set;
        address launchToken;
        address quote;
        address treasury;
        address creator;
        uint16  buyFeeBP;
        uint16  sellFeeBP;
        uint16  burnBP;
        uint24  fee;
        int24   tickSpacing;
    }
    function registerPool(PoolKey calldata key, PoolCfg calldata c) external;
}

// Minimal Uniswap-v3-interface pieces (for basket legs whose liquidity is on a v3 pool).
interface IUniV3Factory { function getPool(address a, address b, uint24 fee) external view returns (address); }
interface IUniV3Pool {
    function liquidity() external view returns (uint128);
    function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool);
    function token0() external view returns (address);
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external returns (int256 amount0, int256 amount1);
}

/**
 * @title FingersBasketSeeder
 * @notice Automatically graduates $FINGERS liquidity into a BASKET of permanently-locked
 *         Uniswap-v4 pools — one FINGERS/asset pool per basket asset (the 4 RWAs + 4
 *         memecoins), with NO FINGERS/USDG pool by design. For each asset a weightᵢ slice
 *         of the collected USDG is swapped USDG→asset (through a manager-vetted or on-chain
 *         DISCOVERED v4/v3 route — never an arbitrary router), then a FINGERS/asset v4 pool
 *         is created with the FingersHook attached, seeded, permanently LOCKED (this
 *         immutable contract owns the position and exposes NO withdraw path → rug-proof),
 *         and REGISTERED with the hook so its 1% fee engine is live immediately.
 *
 *         Every leg is seeded at the SAME FINGERS-per-USD value (each asset amount comes
 *         from swapping an equal-value USDG slice at market), so the 8 pools open at a
 *         CONSISTENT FINGERS price — no built-in arbitrage at launch.
 *
 *         AUTO-BOND, EMERGENCY FALLBACK: if any leg cannot be routed the whole call reverts
 *         (retry once it is routable). Nothing is half-graduated. If graduation stays stuck,
 *         the team pulls the USDG via the game's emergency `withdrawWinUsdg` and seeds
 *         manually — matching the "otomatik; sıkışırsa manuel" decision.
 *
 * @dev Low-level flash-accounting / swap / grief-proof-init / discovery logic is a faithful
 *      port of the audited LuckyLaunch2BasketSeeder; the orchestration is re-oriented to
 *      hook + register EVERY FINGERS/asset pool (no mandatory USDG core leg).
 *
 *      The caller transfers `lpTokens` FINGERS + `gradRaise` USDG here FIRST, then calls
 *      `seedBasket`.
 */
contract FingersBasketSeeder is IUnlockCallback {
    using SafeERC20 for IERC20;
    using StateLibrary for IPoolManager;
    using PoolIdLibrary for PoolKey;

    uint256 private constant BP = 10000;

    IPoolManager public immutable poolManager;
    address public owner;
    address public manager;

    struct Route {
        uint24 fee;
        int24 tickSpacing;
        address hooks;
        bool set;
        bool twoHop;
        address via;
        uint24 fee2;
        int24 tickSpacing2;
        address hooks2;
    }
    mapping(bytes32 => Route) public routes; // key = keccak(usdg, asset) → USDG→asset route

    struct Tier { uint24 fee; int24 tickSpacing; }
    Tier[] public tierCatalog;
    address[] public viaAnchors;
    address[] public hookCatalog;
    address[] public v3Factories;
    uint24[]  public v3Fees;
    address   public weth;
    address   private _v3ActivePool;
    bool    public autoDiscover = true;
    uint128 public minDiscoverLiq = 1;

    // v4 tier for the FINGERS/asset pools this seeder creates.
    uint24 public lpFee = 10000;      // 1% pool tier (matches the fee engine intent)
    int24  public lpTickSpacing = 200;

    event RouteSet(address indexed usdg, address indexed asset, uint24 fee, int24 tickSpacing, address hooks);
    event RouteDiscovered(address indexed usdg, address indexed asset, bool twoHop, address via);
    event DiscoveryConfig(bool autoDiscover, uint128 minDiscoverLiq, uint256 tiers, uint256 vias);
    event AssetSeeded(address indexed token, address indexed asset, uint256 tokenAmt, uint256 assetAmt, uint128 liquidity);
    event PoolRegisteredWithHook(address indexed token, address indexed asset, address hook);
    event BasketGraduated(address indexed token, uint256 poolsCreated);

    modifier onlyOwnerOrManager() {
        require(msg.sender == owner || msg.sender == manager, "auth");
        _;
    }

    constructor(address _poolManager, address _manager) {
        require(_poolManager != address(0), "pm");
        poolManager = IPoolManager(_poolManager);
        owner = msg.sender;
        manager = _manager == address(0) ? msg.sender : _manager;

        tierCatalog.push(Tier(10000, 200));
        tierCatalog.push(Tier(3000, 60));
        tierCatalog.push(Tier(500, 10));
        tierCatalog.push(Tier(100, 1));
        viaAnchors.push(address(0));  // native ETH 2-hop bridge
        hookCatalog.push(address(0)); // hookless first
    }

    // ── Config (routes / tiers only; never fund access) ──
    function routeKey(address usdg, address asset) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(usdg, asset));
    }
    function setRoute(address usdg, address asset, uint24 fee, int24 tickSpacing, address hooks) external onlyOwnerOrManager {
        require(usdg != address(0) && asset != address(0) && asset != usdg, "route");
        routes[routeKey(usdg, asset)] = Route(fee, tickSpacing, hooks, true, false, address(0), 0, 0, address(0));
        emit RouteSet(usdg, asset, fee, tickSpacing, hooks);
    }
    function setRoute2Hop(
        address usdg, address asset, address via,
        uint24 fee1, int24 ts1, address hooks1,
        uint24 fee2, int24 ts2, address hooks2
    ) external onlyOwnerOrManager {
        require(usdg != address(0) && asset != address(0) && asset != usdg && via != usdg && via != asset, "route");
        routes[routeKey(usdg, asset)] = Route(fee1, ts1, hooks1, true, true, via, fee2, ts2, hooks2);
        emit RouteSet(usdg, asset, fee1, ts1, hooks1);
    }
    function setLpTier(uint24 _lpFee, int24 _lpTickSpacing) external onlyOwnerOrManager {
        lpFee = _lpFee;
        lpTickSpacing = _lpTickSpacing;
    }
    function setTierCatalog(Tier[] calldata tiers) external onlyOwnerOrManager {
        delete tierCatalog;
        for (uint256 i = 0; i < tiers.length; i++) tierCatalog.push(tiers[i]);
        emit DiscoveryConfig(autoDiscover, minDiscoverLiq, tierCatalog.length, viaAnchors.length);
    }
    function setViaAnchors(address[] calldata vias) external onlyOwnerOrManager {
        delete viaAnchors;
        for (uint256 i = 0; i < vias.length; i++) viaAnchors.push(vias[i]);
        emit DiscoveryConfig(autoDiscover, minDiscoverLiq, tierCatalog.length, viaAnchors.length);
    }
    function setHookCatalog(address[] calldata hooks) external onlyOwnerOrManager {
        delete hookCatalog;
        for (uint256 i = 0; i < hooks.length; i++) hookCatalog.push(hooks[i]);
        emit DiscoveryConfig(autoDiscover, minDiscoverLiq, tierCatalog.length, viaAnchors.length);
    }
    function setV3Config(address[] calldata factories, uint24[] calldata fees, address _weth) external onlyOwnerOrManager {
        delete v3Factories; delete v3Fees;
        for (uint256 i = 0; i < factories.length; i++) v3Factories.push(factories[i]);
        for (uint256 i = 0; i < fees.length; i++) v3Fees.push(fees[i]);
        weth = _weth;
        emit DiscoveryConfig(autoDiscover, minDiscoverLiq, tierCatalog.length, viaAnchors.length);
    }
    function setDiscovery(bool _autoDiscover, uint128 _minDiscoverLiq) external onlyOwnerOrManager {
        autoDiscover = _autoDiscover;
        minDiscoverLiq = _minDiscoverLiq;
        emit DiscoveryConfig(autoDiscover, minDiscoverLiq, tierCatalog.length, viaAnchors.length);
    }
    function tierCatalogLength() external view returns (uint256) { return tierCatalog.length; }
    function viaAnchorsLength() external view returns (uint256) { return viaAnchors.length; }
    function v3FactoriesLen() external view returns (uint256) { return v3Factories.length; }
    function setManager(address _manager) external { require(msg.sender == owner, "owner"); manager = _manager; }
    function transferOwnership(address _owner) external { require(msg.sender == owner, "owner"); require(_owner != address(0), "zero"); owner = _owner; }

    struct SeedParams {
        address token;       // FINGERS
        address usdg;        // the collected raise currency
        uint256 gradRaise;   // total USDG to deploy
        uint256 lpTokens;    // total FINGERS to deploy (the 50M LP allocation)
        address[] assets;    // the basket (4 RWA + 4 meme); MUST NOT be USDG
        uint256[] weights;   // sum == BP
        address hook;        // FingersHook (attached + registered on every pool)
        address treasury;    // hook fee treasury
        address creator;     // hook knob controller (decrease-only)
        uint16  buyFeeBP;    // ≤ 100
        uint16  sellFeeBP;   // ≤ 100
        uint16  burnBP;      // ≤ BP
    }

    /// @notice Seed the basket. Reverts (atomic) if any leg is unroutable — retry later, or
    ///         pull USDG via the game's emergency path and seed manually.
    function seedBasket(SeedParams calldata p) external returns (uint256 poolsCreated) {
        require(p.assets.length == p.weights.length && p.assets.length >= 1, "basket");
        require(p.hook != address(0), "hook");
        uint256 wsum;
        for (uint256 i = 0; i < p.weights.length; i++) {
            require(p.assets[i] != address(0) && p.assets[i] != p.usdg && p.assets[i] != p.token, "asset");
            wsum += p.weights[i];
        }
        require(wsum == BP, "weights");

        for (uint256 i = 0; i < p.assets.length; i++) {
            address asset = p.assets[i];
            uint256 raisePortion = (p.gradRaise * p.weights[i]) / BP;
            uint256 tokenPortion = (p.lpTokens * p.weights[i]) / BP;

            Route memory r = routes[routeKey(p.usdg, asset)];
            if (!r.set && autoDiscover) {
                (Route memory dr, bool ok) = _discoverRoute(p.usdg, asset);
                if (ok) { r = dr; emit RouteDiscovered(p.usdg, asset, dr.twoHop, dr.via); }
            }

            uint128 lq;
            if (r.set) {
                lq = this.processAsset(p.token, p.usdg, asset, r, raisePortion, tokenPortion, p.hook);
            } else {
                require(autoDiscover && v3Factories.length > 0, "leg: no route");
                lq = this.processAssetV3(p.token, p.usdg, asset, raisePortion, tokenPortion, p.hook);
            }
            emit AssetSeeded(p.token, asset, tokenPortion, raisePortion, lq);

            // Register the freshly-created FINGERS/asset pool with the hook (fee engine live).
            _register(p, asset);
            poolsCreated++;
        }

        // Burn any FINGERS dust from rounding.
        uint256 dust = IERC20(p.token).balanceOf(address(this));
        if (dust > 0) { try IBurnableToken(p.token).burn(dust) {} catch {} }

        emit BasketGraduated(p.token, poolsCreated);
    }

    function _register(SeedParams calldata p, address asset) private {
        (Currency c0, Currency c1) = p.token < asset
            ? (Currency.wrap(p.token), Currency.wrap(asset))
            : (Currency.wrap(asset), Currency.wrap(p.token));
        PoolKey memory key = PoolKey({currency0: c0, currency1: c1, fee: lpFee, tickSpacing: lpTickSpacing, hooks: IHooks(p.hook)});
        IFingersHookRegistrar(p.hook).registerPool(
            key,
            IFingersHookRegistrar.PoolCfg({
                set: false,
                launchToken: p.token,
                quote: asset,
                treasury: p.treasury,
                creator: p.creator,
                buyFeeBP: p.buyFeeBP,
                sellFeeBP: p.sellFeeBP,
                burnBP: p.burnBP,
                fee: lpFee,
                tickSpacing: lpTickSpacing
            })
        );
        emit PoolRegisteredWithHook(p.token, asset, p.hook);
    }

    /// @dev External so the parent isolates a single leg. Swaps USDG→asset, then creates +
    ///      locks a FINGERS/asset pool (with the hook) from (tokenPortion, assetOut).
    function processAsset(
        address token, address usdg, address asset, Route calldata r,
        uint256 raisePortion, uint256 tokenPortion, address hook
    ) external returns (uint128 liquidity) {
        require(msg.sender == address(this), "internal");
        uint256 assetOut = _swapUsdgForAsset(usdg, asset, r, raisePortion);
        require(assetOut > 0, "no out");
        liquidity = _createAndSeed(token, asset, tokenPortion, assetOut, hook);
    }

    function processAssetV3(
        address token, address usdg, address asset,
        uint256 raisePortion, uint256 tokenPortion, address hook
    ) external returns (uint128 liq) {
        require(msg.sender == address(this), "self");
        uint256 assetOut;
        address direct = discoverV3Pool(usdg, asset);
        if (direct != address(0)) {
            assetOut = _swapV3(direct, usdg, raisePortion);
        } else {
            require(weth != address(0), "no weth");
            address p1 = discoverV3Pool(usdg, weth);
            address p2 = discoverV3Pool(weth, asset);
            require(p1 != address(0) && p2 != address(0), "no v3 route");
            uint256 wethOut = _swapV3(p1, usdg, raisePortion);
            assetOut = _swapV3(p2, weth, wethOut);
        }
        require(assetOut > 0, "v3 out");
        liq = _createAndSeed(token, asset, tokenPortion, assetOut, hook);
    }

    // ── On-chain route discovery (view; probes real v4 pools) ──
    function _discoverRoute(address usdg, address asset) internal view returns (Route memory r, bool ok) {
        (Tier memory td, address hd, bool okd) = _bestTier(usdg, asset);
        if (okd) return (Route(td.fee, td.tickSpacing, hd, true, false, address(0), 0, 0, address(0)), true);
        for (uint256 v = 0; v < viaAnchors.length; v++) {
            address via = viaAnchors[v];
            if (via == usdg || via == asset) continue;
            (Tier memory t1, address h1, bool ok1) = _bestTier(usdg, via);
            if (!ok1) continue;
            (Tier memory t2, address h2, bool ok2) = _bestTier(via, asset);
            if (!ok2) continue;
            return (Route(t1.fee, t1.tickSpacing, h1, true, true, via, t2.fee, t2.tickSpacing, h2), true);
        }
    }

    function _bestTier(address a, address b) internal view returns (Tier memory t, address hook, bool ok) {
        uint256 hn = hookCatalog.length;
        for (uint256 i = 0; i < tierCatalog.length; i++) {
            Tier memory c = tierCatalog[i];
            for (uint256 h = 0; h < hn; h++) {
                address hk = hookCatalog[h];
                PoolId id = _poolId(a, b, c.fee, c.tickSpacing, hk);
                (uint160 sqrtPriceX96,,,) = poolManager.getSlot0(id);
                if (sqrtPriceX96 == 0) continue;
                if (poolManager.getLiquidity(id) < minDiscoverLiq) continue;
                return (c, hk, true);
            }
        }
    }

    function _poolId(address a, address b, uint24 fee, int24 ts, address hooks) internal pure returns (PoolId) {
        (Currency c0, Currency c1) = a < b ? (Currency.wrap(a), Currency.wrap(b)) : (Currency.wrap(b), Currency.wrap(a));
        return PoolKey({currency0: c0, currency1: c1, fee: fee, tickSpacing: ts, hooks: IHooks(hooks)}).toId();
    }

    // ── v3-interface fallback ──
    uint160 private constant V3_MIN_SQRT = 4295128739;
    uint160 private constant V3_MAX_SQRT = 1461446703485210103287273052203988822378723970342;

    function discoverV3Pool(address a, address b) public view returns (address pool) {
        uint128 best = 0;
        for (uint256 f = 0; f < v3Factories.length; f++) {
            for (uint256 t = 0; t < v3Fees.length; t++) {
                address p;
                try IUniV3Factory(v3Factories[f]).getPool(a, b, v3Fees[t]) returns (address got) { p = got; } catch { continue; }
                if (p == address(0)) continue;
                try IUniV3Pool(p).liquidity() returns (uint128 l) {
                    if (l >= minDiscoverLiq && l > best) {
                        (uint160 sp,,,,,,) = IUniV3Pool(p).slot0();
                        if (sp != 0) { best = l; pool = p; }
                    }
                } catch { continue; }
            }
        }
    }

    function _swapV3(address pool, address tokenIn, uint256 amountIn) internal returns (uint256 out) {
        bool zeroForOne = IUniV3Pool(pool).token0() == tokenIn;
        _v3ActivePool = pool;
        (int256 a0, int256 a1) = IUniV3Pool(pool).swap(
            address(this), zeroForOne, int256(amountIn),
            zeroForOne ? V3_MIN_SQRT + 1 : V3_MAX_SQRT - 1, abi.encode(tokenIn));
        _v3ActivePool = address(0);
        out = zeroForOne ? uint256(-a1) : uint256(-a0);
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        require(msg.sender == _v3ActivePool && _v3ActivePool != address(0), "v3cb");
        address tokenIn = abi.decode(data, (address));
        uint256 owed = amount0Delta > 0 ? uint256(amount0Delta) : uint256(amount1Delta);
        IERC20(tokenIn).safeTransfer(msg.sender, owed);
    }

    // ── v4 flash-accounting ops ──
    enum Op { SWAP, SEED }

    function _swapUsdgForAsset(address usdg, address asset, Route calldata r, uint256 amountIn) internal returns (uint256 assetOut) {
        if (!r.twoHop) return _oneHop(usdg, asset, r.fee, r.tickSpacing, r.hooks, amountIn);
        uint256 viaOut = _oneHop(usdg, r.via, r.fee, r.tickSpacing, r.hooks, amountIn);
        require(viaOut > 0, "hop1");
        assetOut = _oneHop(r.via, asset, r.fee2, r.tickSpacing2, r.hooks2, viaOut);
    }

    function _oneHop(address tokenIn, address tokenOut, uint24 fee, int24 ts, address hooks, uint256 amountIn) internal returns (uint256 out) {
        (Currency c0, Currency c1) = tokenIn < tokenOut ? (Currency.wrap(tokenIn), Currency.wrap(tokenOut)) : (Currency.wrap(tokenOut), Currency.wrap(tokenIn));
        PoolKey memory key = PoolKey({currency0: c0, currency1: c1, fee: fee, tickSpacing: ts, hooks: IHooks(hooks)});
        bytes memory ret = poolManager.unlock(abi.encode(Op.SWAP, key, tokenIn, tokenOut, amountIn, uint256(0), int24(0), int24(0)));
        out = abi.decode(ret, (uint256));
    }

    function _createAndSeed(address token, address quote, uint256 amountToken, uint256 amountQuote, address hooks) internal returns (uint128 liquidity) {
        (Currency c0, Currency c1, uint256 amount0, uint256 amount1) = token < quote
            ? (Currency.wrap(token), Currency.wrap(quote), amountToken, amountQuote)
            : (Currency.wrap(quote), Currency.wrap(token), amountQuote, amountToken);
        PoolKey memory key = PoolKey({currency0: c0, currency1: c1, fee: lpFee, tickSpacing: lpTickSpacing, hooks: IHooks(hooks)});
        uint160 sqrtPriceX96;
        {
            (uint160 existing,,,) = poolManager.getSlot0(key.toId());
            if (existing == 0) {
                sqrtPriceX96 = _sqrtPriceFromAmounts(amount0, amount1);
                poolManager.initialize(key, sqrtPriceX96);
            } else {
                sqrtPriceX96 = existing;
            }
        }
        int24 tickLower = (TickMath.MIN_TICK / lpTickSpacing) * lpTickSpacing;
        int24 tickUpper = (TickMath.MAX_TICK / lpTickSpacing) * lpTickSpacing;
        bytes memory ret = poolManager.unlock(abi.encode(Op.SEED, key, address(0), address(0), amount0, amount1, tickLower, tickUpper));
        liquidity = abi.decode(ret, (uint128));
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "not pm");
        (Op op, PoolKey memory key, address a, address b, uint256 x, uint256 y, int24 tl, int24 tu) =
            abi.decode(data, (Op, PoolKey, address, address, uint256, uint256, int24, int24));

        if (op == Op.SWAP) {
            address usdg = a;
            address asset = b;
            uint256 amountIn = x;
            bool zeroForOne = Currency.unwrap(key.currency0) == usdg;
            BalanceDelta delta = poolManager.swap(
                key,
                SwapParams({zeroForOne: zeroForOne, amountSpecified: -int256(amountIn), sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1}),
                ""
            );
            int128 d0 = delta.amount0();
            int128 d1 = delta.amount1();
            uint256 out;
            if (d0 < 0) _settle(key.currency0, uint256(uint128(-d0)));
            if (d1 < 0) _settle(key.currency1, uint256(uint128(-d1)));
            if (d0 > 0) { poolManager.take(key.currency0, address(this), uint256(uint128(d0))); if (Currency.unwrap(key.currency0) == asset) out = uint256(uint128(d0)); }
            if (d1 > 0) { poolManager.take(key.currency1, address(this), uint256(uint128(d1))); if (Currency.unwrap(key.currency1) == asset) out = uint256(uint128(d1)); }
            return abi.encode(out);
        } else {
            (uint160 sqrtP,,,) = poolManager.getSlot0(key.toId());
            uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(sqrtP, TickMath.getSqrtPriceAtTick(tl), TickMath.getSqrtPriceAtTick(tu), x, y);
            require(liquidity > 0, "no liq");
            (BalanceDelta delta,) = poolManager.modifyLiquidity(
                key,
                ModifyLiquidityParams({tickLower: tl, tickUpper: tu, liquidityDelta: int256(uint256(liquidity)), salt: bytes32(0)}),
                ""
            );
            int128 d0 = delta.amount0();
            int128 d1 = delta.amount1();
            if (d0 < 0) _settle(key.currency0, uint256(uint128(-d0)));
            if (d1 < 0) _settle(key.currency1, uint256(uint128(-d1)));
            if (d0 > 0) poolManager.take(key.currency0, address(this), uint256(uint128(d0)));
            if (d1 > 0) poolManager.take(key.currency1, address(this), uint256(uint128(d1)));
            return abi.encode(liquidity);
        }
    }

    function _settle(Currency currency, uint256 amount) internal {
        if (Currency.unwrap(currency) == address(0)) {
            poolManager.settle{value: amount}();
        } else {
            poolManager.sync(currency);
            IERC20(Currency.unwrap(currency)).safeTransfer(address(poolManager), amount);
            poolManager.settle();
        }
    }

    receive() external payable {}

    function _sqrtPriceFromAmounts(uint256 amount0, uint256 amount1) internal pure returns (uint160) {
        require(amount0 > 0 && amount1 > 0, "amounts");
        uint256 ratioX192 = FullMath.mulDiv(amount1, uint256(1) << 192, amount0);
        uint256 s = Math.sqrt(ratioX192);
        if (s <= uint256(TickMath.MIN_SQRT_PRICE)) return TickMath.MIN_SQRT_PRICE + 1;
        if (s >= uint256(TickMath.MAX_SQRT_PRICE)) return TickMath.MAX_SQRT_PRICE - 1;
        return uint160(s);
    }
}
