import { createPublicClient, http, namehash } from "viem";
import { mainnet } from "viem/chains";

const address = process.argv[2] || "0x5e3a32107d6a57d71158500B45D64304B7D33BFb";
const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

console.log("Testing ENS reverse lookup for:", address);

// Method 1: viem built-in
try {
  const name = await client.getEnsName({ address });
  console.log("viem getEnsName (strict):", name);
} catch (e) {
  console.log("viem getEnsName error:", e.message);
}

// Method 2: direct contract call (no forward check)
try {
  const reverseNode = namehash(`${address.toLowerCase().replace("0x", "")}.addr.reverse`);
  console.log("reverseNode:", reverseNode);

  const resolverAddress = await client.readContract({
    address: ENS_REGISTRY,
    abi: [{ name: "resolver", type: "function", inputs: [{ name: "node", type: "bytes32" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" }],
    functionName: "resolver",
    args: [reverseNode],
  });
  console.log("resolver address:", resolverAddress);

  if (resolverAddress === "0x0000000000000000000000000000000000000000") {
    console.log("No reverse record set for this address.");
  } else {
    const name = await client.readContract({
      address: resolverAddress,
      abi: [{ name: "name", type: "function", inputs: [{ name: "node", type: "bytes32" }], outputs: [{ name: "", type: "string" }], stateMutability: "view" }],
      functionName: "name",
      args: [reverseNode],
    });
    console.log("name from resolver:", name);
  }
} catch (e) {
  console.log("direct contract error:", e.message);
}

// Method 3: try a different RPC
try {
  const client2 = createPublicClient({ chain: mainnet, transport: http("https://cloudflare-eth.com") });
  const name = await client2.getEnsName({ address });
  console.log("cloudflare RPC getEnsName:", name);
} catch (e) {
  console.log("cloudflare RPC error:", e.message);
}
