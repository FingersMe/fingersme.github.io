// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// Pull the Uniswap v4 test router into the compilation set so fork tests can deploy it via
// getContractFactory("PoolSwapTest") to execute REAL swaps against the live v4 PoolManager.
// Not deployed in production.
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
