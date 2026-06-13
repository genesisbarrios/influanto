import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./contracts/artifacts",
  },
};
