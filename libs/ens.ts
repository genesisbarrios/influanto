import { createPublicClient, http, namehash } from "viem";
import { mainnet } from "viem/chains";

const PARENT_DOMAIN = "influanto.eth";

// ENS NameWrapper on mainnet — needed for subname creation once influanto.eth is registered
const ENS_NAME_WRAPPER = "0xD4416b13d2b3a9aDae7AcD5D6C2BbDBE25686401" as const;
const ENS_PUBLIC_RESOLVER = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41" as const;

function getPublicClient() {
  // Fall back to a reliable public Ethereum mainnet RPC for ENS lookups.
  // ENS lives on mainnet; this is only used server-side for reverse resolution.
  const rpcUrl = process.env.ETHEREUM_RPC_URL ?? "https://ethereum.publicnode.com";
  return createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });
}

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as const;

const REGISTRY_ABI = [{
  name: "resolver",
  type: "function",
  inputs: [{ name: "node", type: "bytes32" }],
  outputs: [{ name: "", type: "address" }],
  stateMutability: "view",
}] as const;

const RESOLVER_ABI = [{
  name: "name",
  type: "function",
  inputs: [{ name: "node", type: "bytes32" }],
  outputs: [{ name: "", type: "string" }],
  stateMutability: "view",
}] as const;

/**
 * Reverse-lookup: reads the ENS reverse record directly from the registry and
 * resolver without a forward-resolution check. Matches how OpenSea resolves names.
 */
export async function getEnsNameForAddress(address: string): Promise<string | null> {
  try {
    const client = getPublicClient();
    const reverseNode = namehash(
      `${address.toLowerCase().replace("0x", "")}.addr.reverse`
    );

    const resolverAddress = await client.readContract({
      address: ENS_REGISTRY,
      abi: REGISTRY_ABI,
      functionName: "resolver",
      args: [reverseNode],
    });

    if (!resolverAddress || resolverAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    const name = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: "name",
      args: [reverseNode],
    });

    return (name as string) || null;
  } catch {
    return null;
  }
}

/** Sanitizes a username into a valid ENS label and returns the full subname */
export function buildInfluantoSubname(username: string): string {
  const label = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "user";
  return `${label}.${PARENT_DOMAIN}`;
}

/**
 * Updates an existing influanto.eth subname to point to a new owner address.
 * Called when the user changes their primary wallet.
 * No-op until INFLUANTO_ENS_OWNER_PRIVATE_KEY is set (domain not yet registered).
 */
export async function updateInfluantoSubnameOwner(
  label: string,
  newOwnerAddress: string
): Promise<void> {
  const ownerPrivateKey = process.env.INFLUANTO_ENS_OWNER_PRIVATE_KEY;
  if (!ownerPrivateKey) return;

  const { createWalletClient, namehash } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");

  const account = privateKeyToAccount(ownerPrivateKey as `0x${string}`);
  const walletClient = createWalletClient({ account, chain: mainnet, transport: http() });

  const ensNameWrapperAbi = [{
    name: "setSubnodeRecord",
    type: "function",
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label",      type: "string"  },
      { name: "owner",      type: "address" },
      { name: "resolver",   type: "address" },
      { name: "ttl",        type: "uint64"  },
      { name: "fuses",      type: "uint32"  },
      { name: "expiry",     type: "uint64"  },
    ],
    outputs: [{ name: "node", type: "bytes32" }],
  }] as const;

  await walletClient.writeContract({
    address: ENS_NAME_WRAPPER,
    abi: ensNameWrapperAbi,
    functionName: "setSubnodeRecord",
    args: [
      namehash(PARENT_DOMAIN),
      label,
      newOwnerAddress as `0x${string}`,
      ENS_PUBLIC_RESOLVER,
      0n,
      0,
      2n ** 64n - 1n,
    ],
  });
}

/**
 * Creates a subname under influanto.eth for the given owner address.
 */
export async function createInfluantoSubname(
  username: string,
  ownerAddress: string
): Promise<string> {
  const ensName = buildInfluantoSubname(username);
  const ownerPrivateKey = process.env.INFLUANTO_ENS_OWNER_PRIVATE_KEY;

  if (!ownerPrivateKey) {
    // influanto.eth not yet registered — return intended name for DB storage only
    return ensName;
  }

  const { createWalletClient, namehash, labelhash } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  
  const account = privateKeyToAccount(ownerPrivateKey as `0x${string}`);
  const walletClient = createWalletClient({ account, chain: mainnet, transport: http() });
  
  const ensNameWrapperAbi = [{
    name: "setSubnodeRecord",
    type: "function",
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label",      type: "string"  },
      { name: "owner",      type: "address" },
      { name: "resolver",   type: "address" },
      { name: "ttl",        type: "uint64"  },
      { name: "fuses",      type: "uint32"  },
      { name: "expiry",     type: "uint64"  },
    ],
    outputs: [{ name: "node", type: "bytes32" }],
  }] as const;
  
  await walletClient.writeContract({
    address: ENS_NAME_WRAPPER,
    abi: ensNameWrapperAbi,
    functionName: "setSubnodeRecord",
    args: [
      namehash(PARENT_DOMAIN),
      username,
      ownerAddress as `0x${string}`,
      ENS_PUBLIC_RESOLVER,
      0n,
      0,
      2n ** 64n - 1n,
    ],
  });

  return ensName;
}
