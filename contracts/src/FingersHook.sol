// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IStateView} from "@uniswap/v4-periphery/src/interfaces/IStateView.sol";
import {LiquidityAmounts} from "@uniswap/v4-periphery/src/libraries/LiquidityAmounts.sol";

interface IFingersStakingSink {
    function notifyReward(address token, uint256 amount) external;
}

interface IBurnableFingers {
    function burn(uint256 value) external;
}

/**
 * @title FingersHook — the $FINGERS tokenomics engine (SINGLETON v4 hook)
 * @notice One shared hook serves every FINGERS / quote-asset pool created by the
 *         migrator/seeder. On every swap in a REGISTERED pool it skims a per-pool,
 *         ≤1%-capped, DECREASE-ONLY, buy/sell-asymmetric fee from the swap's
 *         UNSPECIFIED currency and accrues it per (pool, token). The fee funds exactly
 *         the three things the design calls for — buyback, burn, and staker rewards:
 *
 *           • FINGERS skim  -> burn `burnBP` share (deflation) + `stakerBP` share streamed
 *                              to the FINGERS staking farm (boosted by staked NFTs) +
 *                              remainder to the creator/treasury.
 *           • quote  skim   -> held accrued and used by the permissionless reflexive
 *                              `buybackAndBurn` (swap quote -> FINGERS in the pool, then
 *                              BURN it): buy pressure + supply reduction driven by volume.
 *
 *         Knobs are per-pool, ≤ 100 bp each, DECREASE-ONLY after graduation, with
 *         independent buy/sell values. Nothing here can mint supply, seize funds, unlock
 *         LP, or pump at will — the hook only ever holds already-skimmed fees.
 *
 * @dev Adapted from the audited LuckyLaunch2Hook (AVLO-specific buyback vault removed;
 *      quote skim now funds the reflexive FINGERS buyback directly). Skims only OUR
 *      registered pools, so $FINGERS stays composable elsewhere.
 */
contract FingersHook is BaseHook {
    using SafeERC20 for IERC20;
    using PoolIdLibrary for PoolKey;

    uint256 private constant BP = 10000;
    uint256 public constant MAX_KNOB_BP = 100; // each fee knob ≤ 1.00%

    IStateView public immutable stateView; // for autoLp price reads
    address public registrar;              // the migrator/seeder allowed to register pools
    address public owner;

    struct PoolCfg {
        bool    set;
        address launchToken; // FINGERS
        address quote;        // the paired basket asset
        address treasury;
        address creator;
        uint16  buyFeeBP;     // skim on buys  (acquiring FINGERS)
        uint16  sellFeeBP;    // skim on sells (disposing FINGERS)
        uint16  burnBP;       // share of a FINGERS skim that is burned (≤ BP)
        uint24  fee;          // the pool's v4 fee tier (for buyback swaps)
        int24   tickSpacing;
    }
    mapping(PoolId => PoolCfg) public pools;
    mapping(PoolId => mapping(address => uint256)) public accrued;   // poolId → token → held
    mapping(PoolId => uint256) public buybackVolume;                 // lifetime quote bought-back+burned
    mapping(PoolId => uint256) public cumVolume;                     // cumulative quote-side volume

    // Milestones: immutable ascending volume thresholds; crossing one auto-fires a buyback.
    mapping(PoolId => uint256[]) public milestones;
    mapping(PoolId => uint256)  public milestonesHit;

    // Staking: a share of the FINGERS skim streamed to the FINGERS staking farm.
    mapping(PoolId => address) public stakingOf;
    mapping(PoolId => uint16)  public stakerBP;

    // Full automation defaults (no keeper).
    address public defaultStaking;
    uint16  public defaultStakerBP = 3000; // 30% of the post-burn FINGERS skim → stakers
    bool    public autoProcess;
    uint16  public treasuryShareBP = 0;    // optional bp of quote skim auto-sent to treasury (rest → buyback)

    event PoolRegistered(PoolId indexed id, address indexed launchToken, address quote, uint16 buyFeeBP, uint16 sellFeeBP, uint16 burnBP);
    event KnobsUpdated(PoolId indexed id, uint16 buyFeeBP, uint16 sellFeeBP, uint16 burnBP);
    event Skimmed(PoolId indexed id, address indexed token, uint256 amount, bool isBuy);
    event FeesProcessed(PoolId indexed id, address indexed token, uint256 toTreasury, uint256 burned, uint256 toStakers, uint256 toCreator);
    event BuybackBurned(PoolId indexed id, uint256 quoteIn, uint256 tokenBurned);
    event MilestonesSet(PoolId indexed id, uint256[] thresholds);
    event MilestoneHit(PoolId indexed id, uint256 index, uint256 threshold, uint256 volume, uint256 tokenBurned);
    event StakingSet(PoolId indexed id, address staking, uint16 stakerBP);
    event StakerRewarded(PoolId indexed id, address indexed staking, uint256 amount);
    event AutoLpAdded(PoolId indexed id, uint256 tokenIn, uint256 quoteIn, uint128 liquidity);

    constructor(IPoolManager _pm, address _registrar, address _stateView, address _owner) BaseHook(_pm) {
        stateView = IStateView(_stateView);
        registrar = _registrar;
        owner = _owner == address(0) ? msg.sender : _owner;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: true,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ── Admin (config only; never fund access) ──
    function setRegistrar(address _registrar) external { require(msg.sender == owner, "owner"); registrar = _registrar; }
    function transferOwnership(address _o) external { require(msg.sender == owner, "owner"); require(_o != address(0), "zero"); owner = _o; }
    function setStakingDefaults(address staking, uint16 bp) external { require(msg.sender == owner, "owner"); require(bp <= BP, "bp"); defaultStaking = staking; defaultStakerBP = bp; }
    function setAutoProcess(bool on) external { require(msg.sender == owner, "owner"); autoProcess = on; }
    function setTreasuryShareBP(uint16 bp) external { require(msg.sender == owner, "owner"); require(bp <= BP, "bp"); treasuryShareBP = bp; }

    function registerPool(PoolKey calldata key, PoolCfg calldata c) external {
        require(msg.sender == registrar, "registrar");
        PoolId id = key.toId();
        require(!pools[id].set, "registered");
        require(c.buyFeeBP <= MAX_KNOB_BP && c.sellFeeBP <= MAX_KNOB_BP, "knob>1%");
        require(c.burnBP <= BP, "burnBP");
        require(c.launchToken != address(0), "cfg");
        PoolCfg memory cfg = c;
        cfg.set = true;
        pools[id] = cfg;
        emit PoolRegistered(id, c.launchToken, c.quote, c.buyFeeBP, c.sellFeeBP, c.burnBP);
        if (defaultStaking != address(0) && defaultStakerBP > 0 && stakingOf[id] == address(0)) {
            stakingOf[id] = defaultStaking;
            stakerBP[id] = defaultStakerBP;
            emit StakingSet(id, defaultStaking, defaultStakerBP);
        }
    }

    /// @notice Creator may only DECREASE knobs after graduation (never raise).
    function decreaseKnobs(PoolId id, uint16 buyFeeBP, uint16 sellFeeBP, uint16 burnBP) external {
        PoolCfg storage m = pools[id];
        require(m.set && msg.sender == m.creator, "auth");
        require(buyFeeBP <= m.buyFeeBP && sellFeeBP <= m.sellFeeBP && burnBP <= m.burnBP, "increase");
        m.buyFeeBP = buyFeeBP;
        m.sellFeeBP = sellFeeBP;
        m.burnBP = burnBP;
        emit KnobsUpdated(id, buyFeeBP, sellFeeBP, burnBP);
    }

    // ── The engine: skim on every swap in a registered pool ──
    function _afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        if (sender == address(this)) return (IHooks.afterSwap.selector, int128(0)); // exempt our own buyback swap
        PoolId id = key.toId();
        PoolCfg memory m = pools[id];
        if (!m.set) return (IHooks.afterSwap.selector, int128(0));

        bool exactIn = params.amountSpecified < 0;
        Currency unspec = exactIn
            ? (params.zeroForOne ? key.currency1 : key.currency0)
            : (params.zeroForOne ? key.currency0 : key.currency1);
        bool unspecIs0 = Currency.unwrap(unspec) == Currency.unwrap(key.currency0);
        int128 unspecDelta = unspecIs0 ? delta.amount0() : delta.amount1();
        uint256 mag = unspecDelta >= 0 ? uint256(uint128(unspecDelta)) : uint256(uint128(-unspecDelta));
        if (mag == 0) return (IHooks.afterSwap.selector, int128(0));

        bool acquiredIsToken;
        int128 a0 = delta.amount0();
        if (a0 > 0) acquiredIsToken = Currency.unwrap(key.currency0) == m.launchToken;
        else acquiredIsToken = Currency.unwrap(key.currency1) == m.launchToken;

        {
            int128 qd = (Currency.unwrap(key.currency0) == m.quote) ? delta.amount0() : delta.amount1();
            cumVolume[id] += qd >= 0 ? uint256(uint128(qd)) : uint256(uint128(-qd));
        }

        uint256 feeBP = acquiredIsToken ? m.buyFeeBP : m.sellFeeBP;
        if (feeBP == 0) return (IHooks.afterSwap.selector, int128(0));
        uint256 fee = (mag * feeBP) / BP;
        if (fee == 0) return (IHooks.afterSwap.selector, int128(0));

        poolManager.take(unspec, address(this), fee);
        address feeTok = Currency.unwrap(unspec);
        accrued[id][feeTok] += fee;
        emit Skimmed(id, feeTok, fee, acquiredIsToken);

        if (autoProcess) {
            if (feeTok == m.launchToken) {
                try this.processFees(id, feeTok) {} catch {}
            } else if (treasuryShareBP > 0) {
                uint256 toTreasury = (fee * treasuryShareBP) / BP;
                if (toTreasury > 0 && toTreasury <= accrued[id][feeTok] && m.treasury != address(0)) {
                    accrued[id][feeTok] -= toTreasury;
                    IERC20(feeTok).safeTransfer(m.treasury, toTreasury);
                }
            }
        }

        return (IHooks.afterSwap.selector, int128(uint128(fee)));
    }

    // ── Permissionless fee routing (rule-based) ──
    function processFees(PoolId id, address token) external returns (uint256 handled) {
        PoolCfg memory m = pools[id];
        require(m.set, "pool");
        handled = accrued[id][token];
        if (handled == 0) return 0;
        accrued[id][token] = 0;

        if (token == m.launchToken) {
            uint256 burnAmt = (handled * m.burnBP) / BP;
            uint256 rem = handled - burnAmt;
            uint256 toStakers;
            address staking = stakingOf[id];
            if (staking != address(0) && stakerBP[id] > 0) {
                toStakers = (rem * stakerBP[id]) / BP;
                if (toStakers > 0) {
                    IERC20(token).safeTransfer(staking, toStakers);
                    IFingersStakingSink(staking).notifyReward(token, toStakers);
                    emit StakerRewarded(id, staking, toStakers);
                }
            }
            uint256 toCreator = rem - toStakers;
            if (burnAmt > 0) { try IBurnableFingers(token).burn(burnAmt) {} catch { IERC20(token).safeTransfer(address(0xdEaD), burnAmt); } }
            if (toCreator > 0 && m.creator != address(0)) IERC20(token).safeTransfer(m.creator, toCreator);
            emit FeesProcessed(id, token, 0, burnAmt, toStakers, toCreator);
        } else {
            // quote skim: default keeps it accrued for the reflexive buyback; only an
            // explicit treasury share (if set) is peeled off here.
            uint256 toTreasury = treasuryShareBP > 0 ? (handled * treasuryShareBP) / BP : 0;
            uint256 keep = handled - toTreasury;
            if (keep > 0) accrued[id][token] += keep; // put the rest back for buybackAndBurn
            if (toTreasury > 0 && m.treasury != address(0)) IERC20(token).safeTransfer(m.treasury, toTreasury);
            emit FeesProcessed(id, token, toTreasury, 0, 0, 0);
        }
    }

    // ── Reflexive buyback-and-burn (volume feeds the token) ──
    uint256 private _swapLock;
    function buybackAndBurn(PoolId id, uint256 minTokenOut) public returns (uint256 bought) {
        return _doBuyback(id, minTokenOut);
    }

    function _doBuyback(PoolId id, uint256 minTokenOut) internal returns (uint256 bought) {
        require(_swapLock != 2, "reentrant");
        _swapLock = 2;
        PoolCfg memory m = pools[id];
        require(m.set, "pool");
        uint256 quoteAmt = accrued[id][m.quote];
        require(quoteAmt > 0, "no quote");
        accrued[id][m.quote] = 0;

        bytes memory ret = poolManager.unlock(abi.encode(uint8(0), m.launchToken, m.quote, m.fee, m.tickSpacing, quoteAmt, minTokenOut));
        bought = abi.decode(ret, (uint256));

        if (bought > 0) {
            try IBurnableFingers(m.launchToken).burn(bought) {}
            catch { IERC20(m.launchToken).safeTransfer(address(0xdEaD), bought); }
        }
        buybackVolume[id] += quoteAmt;
        _swapLock = 1;
        emit BuybackBurned(id, quoteAmt, bought);
    }

    // ── Milestones ──
    function setMilestones(PoolId id, uint256[] calldata thresholds) external {
        PoolCfg memory m = pools[id];
        require(m.set && msg.sender == m.creator, "auth");
        require(milestones[id].length == 0 && thresholds.length > 0, "set");
        for (uint256 i = 1; i < thresholds.length; i++) require(thresholds[i] > thresholds[i - 1], "order");
        milestones[id] = thresholds;
        emit MilestonesSet(id, thresholds);
    }

    function pokeMilestone(PoolId id) external returns (uint256 fired) {
        uint256[] storage ms = milestones[id];
        uint256 hit = milestonesHit[id];
        uint256 vol = cumVolume[id];
        while (hit < ms.length && vol >= ms[hit]) {
            uint256 burned;
            if (accrued[id][pools[id].quote] > 0) burned = _doBuyback(id, 0);
            emit MilestoneHit(id, hit, ms[hit], vol, burned);
            hit++;
            fired++;
        }
        if (fired > 0) milestonesHit[id] = hit;
    }

    // ── Staking config ──
    function setStaking(PoolId id, address staking, uint16 bp) external {
        PoolCfg memory m = pools[id];
        require(m.set && msg.sender == m.creator, "auth");
        require(bp <= BP, "bp");
        stakingOf[id] = staking;
        stakerBP[id] = bp;
        emit StakingSet(id, staking, bp);
    }

    // ── autoLp: grow the LOCKED liquidity from accrued fees ──
    function addLiquidityFromFees(PoolId id, uint128 minLiquidity) external returns (uint128 liquidity) {
        require(_swapLock != 2, "reentrant");
        _swapLock = 2;
        PoolCfg memory m = pools[id];
        require(m.set, "pool");
        uint256 tokAmt = accrued[id][m.launchToken];
        uint256 quoteAmt = accrued[id][m.quote];
        require(tokAmt > 0 && quoteAmt > 0, "need both");
        accrued[id][m.launchToken] = 0;
        accrued[id][m.quote] = 0;

        bytes memory ret = poolManager.unlock(abi.encode(uint8(1), m.launchToken, m.quote, m.fee, m.tickSpacing, tokAmt, quoteAmt));
        uint256 leftT;
        uint256 leftQ;
        (liquidity, leftT, leftQ) = abi.decode(ret, (uint128, uint256, uint256));
        if (leftT > 0) accrued[id][m.launchToken] += leftT;
        if (leftQ > 0) accrued[id][m.quote] += leftQ;
        require(liquidity >= minLiquidity, "slippage");
        _swapLock = 1;
        emit AutoLpAdded(id, tokAmt - leftT, quoteAmt - leftQ, liquidity);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "not pm");
        uint8 op = abi.decode(data, (uint8));
        (, address token, address quote, uint24 fee, int24 tickSpacing, uint256 x, uint256 y) =
            abi.decode(data, (uint8, address, address, uint24, int24, uint256, uint256));

        (Currency c0, Currency c1) = quote < token
            ? (Currency.wrap(quote), Currency.wrap(token))
            : (Currency.wrap(token), Currency.wrap(quote));
        PoolKey memory key = PoolKey({currency0: c0, currency1: c1, fee: fee, tickSpacing: tickSpacing, hooks: IHooks(address(this))});

        if (op == 0) {
            bool zeroForOne = Currency.unwrap(c0) == quote; // sell quote for token
            BalanceDelta delta = poolManager.swap(
                key,
                SwapParams({
                    zeroForOne: zeroForOne,
                    amountSpecified: -int256(x),
                    sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
                }),
                ""
            );
            int128 d0 = delta.amount0();
            int128 d1 = delta.amount1();
            uint256 bought;
            if (d0 < 0) _settle(c0, uint256(uint128(-d0)));
            if (d1 < 0) _settle(c1, uint256(uint128(-d1)));
            if (d0 > 0) { poolManager.take(c0, address(this), uint256(uint128(d0))); if (Currency.unwrap(c0) == token) bought = uint256(uint128(d0)); }
            if (d1 > 0) { poolManager.take(c1, address(this), uint256(uint128(d1))); if (Currency.unwrap(c1) == token) bought = uint256(uint128(d1)); }
            require(bought >= y, "slippage");
            return abi.encode(bought);
        } else {
            (uint256 amount0, uint256 amount1) = token < quote ? (x, y) : (y, x);
            PoolId pid = key.toId();
            (uint160 sqrtP,,,) = stateView.getSlot0(pid);
            int24 tickLower = (TickMath.MIN_TICK / tickSpacing) * tickSpacing;
            int24 tickUpper = (TickMath.MAX_TICK / tickSpacing) * tickSpacing;
            uint128 liq = LiquidityAmounts.getLiquidityForAmounts(
                sqrtP, TickMath.getSqrtPriceAtTick(tickLower), TickMath.getSqrtPriceAtTick(tickUpper), amount0, amount1
            );
            require(liq > 0, "no liq");
            (BalanceDelta delta,) = poolManager.modifyLiquidity(
                key,
                ModifyLiquidityParams({tickLower: tickLower, tickUpper: tickUpper, liquidityDelta: int256(uint256(liq)), salt: bytes32(0)}),
                ""
            );
            int128 dd0 = delta.amount0();
            int128 dd1 = delta.amount1();
            uint256 consumed0;
            uint256 consumed1;
            if (dd0 < 0) { consumed0 = uint256(uint128(-dd0)); _settle(c0, consumed0); }
            if (dd1 < 0) { consumed1 = uint256(uint128(-dd1)); _settle(c1, consumed1); }
            if (dd0 > 0) poolManager.take(c0, address(this), uint256(uint128(dd0)));
            if (dd1 > 0) poolManager.take(c1, address(this), uint256(uint128(dd1)));
            uint256 left0 = amount0 - consumed0;
            uint256 left1 = amount1 - consumed1;
            (uint256 leftT, uint256 leftQ) = token < quote ? (left0, left1) : (left1, left0);
            return abi.encode(liq, leftT, leftQ);
        }
    }

    function _settle(Currency currency, uint256 amount) internal {
        poolManager.sync(currency);
        IERC20(Currency.unwrap(currency)).safeTransfer(address(poolManager), amount);
        poolManager.settle();
    }

    // ── Views ──
    function poolConfig(PoolId id) external view returns (PoolCfg memory) { return pools[id]; }
    function accruedOf(PoolId id, address token) external view returns (uint256) { return accrued[id][token]; }
    function milestonesOf(PoolId id) external view returns (uint256[] memory, uint256) { return (milestones[id], milestonesHit[id]); }
}
