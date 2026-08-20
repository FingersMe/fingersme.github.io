require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  process.env.DEPLOYER_PRIVATE_KEY ||
  "0x0000000000000000000000000000000000000000000000000000000000000001";

module.exports = {
  paths: {
    sources: "./src",
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 60000000,
    },
    robinhood: {
      url: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
      chainId: Number(process.env.ROBINHOOD_CHAIN_ID || 4663),
      accounts: [PRIVATE_KEY],
      timeout: 300000,
    },
  },
  etherscan: {
    apiKey: {
      robinhood: process.env.ROBINHOOD_EXPLORER_API_KEY || "blockscout",
    },
    customChains: [
      {
        network: "robinhood",
        chainId: Number(process.env.ROBINHOOD_CHAIN_ID || 4663),
        urls: {
          apiURL:
            process.env.ROBINHOOD_EXPLORER_API_URL ||
            "https://robinhoodchain.blockscout.com/api",
          browserURL:
            process.env.ROBINHOOD_EXPLORER_BROWSER_URL ||
            "https://robinhoodchain.blockscout.com",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.dev/server",
    browserUrl: "https://repo.sourcify.dev",
  },
};
