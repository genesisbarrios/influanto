import { ethers } from "ethers";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

const NETWORKS = {
  amoy: {
    rpc: "https://rpc-amoy.polygon.technology",
    chainId: 80002,
    explorer: "https://amoy.polygonscan.com",
  },
  polygon: {
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    explorer: "https://polygonscan.com",
  },
};

async function main() {
  const networkName = process.argv[2] || "amoy";
  const net = NETWORKS[networkName];
  if (!net) throw new Error(`Unknown network: ${networkName}. Use 'amoy' or 'polygon'.`);

  const privateKey = process.env.INFLUANTO_ENS_OWNER_PRIVATE_KEY;
  if (!privateKey) throw new Error("INFLUANTO_ENS_OWNER_PRIVATE_KEY not set in .env.local");

  // Load compiled artifact
  const artifactPath = resolve(__dirname, "../contracts/artifacts/contracts/Collectible.sol/MusicNFT.json");
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  } catch {
    throw new Error(`Artifact not found at ${artifactPath} — run 'npx hardhat compile' first`);
  }

  const provider = new ethers.JsonRpcProvider(net.rpc, net.chainId);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log(`\n🚀 Deploying MusicNFT to ${networkName}...`);
  console.log(`📬 Deployer address: ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} MATIC\n`);

  if (balance === 0n) {
    throw new Error(`Deployer has no MATIC — get testnet MATIC from https://faucet.polygon.technology/`);
  }

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("✅ MusicNFT deployed!");
  console.log(`📍 Contract address: ${address}`);
  console.log(`🔗 Transaction hash: ${deployTx?.hash}`);
  console.log(`🔎 View on explorer: ${net.explorer}/address/${address}`);
  console.log(`\n📝 Add this to your .env.local:\nNEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS=${address}\n`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error.message);
  process.exitCode = 1;
});
