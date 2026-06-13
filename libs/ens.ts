import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const PARENT_DOMAIN = "influanto.eth";

// ENS NameWrapper on mainnet — needed for subname creation once influanto.eth is registered
const ENS_NAME_WRAPPER = "0xD4416b13d2b3a9aDae7AcD5D6C2BbDBE25686401" as const;
const ENS_PUBLIC_RESOLVER = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41" as const;

function getPublicClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETHEREUM_RPC_URL),
  });
}

/** Reverse-lookup: returns the primary ENS name for an address, or null */
export async function getEnsNameForAddress(address: string): Promise<string | null> {
  try {
    const client = getPublicClient();
    const result = await client.getEnsName({ address: address as `0x${string}` });
    return result ?? null;
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
 * Creates a subname under influanto.eth for the given owner address.
 *
 * When INFLUANTO_ENS_OWNER_PRIVATE_KEY is not set (influanto.eth not yet
 * registered), we store the intended name without registering it on-chain.
 * Once the domain is registered and the key is set, this function will
 * execute the actual NameWrapper.setSubnodeRecord transaction.
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

  // Once influanto.eth is registered, uncomment and complete this block:
  //
  // const { createWalletClient, namehash, labelhash } = await import("viem");
  // const { privateKeyToAccount } = await import("viem/accounts");
  //
  // const account = privateKeyToAccount(ownerPrivateKey as `0x${string}`);
  // const walletClient = createWalletClient({ account, chain: mainnet, transport: http() });
  //
  // const ensNameWrapperAbi = [{
  //   name: "setSubnodeRecord",
  //   type: "function",
  //   inputs: [
  //     { name: "parentNode", type: "bytes32" },
  //     { name: "label",      type: "string"  },
  //     { name: "owner",      type: "address" },
  //     { name: "resolver",   type: "address" },
  //     { name: "ttl",        type: "uint64"  },
  //     { name: "fuses",      type: "uint32"  },
  //     { name: "expiry",     type: "uint64"  },
  //   ],
  //   outputs: [{ name: "node", type: "bytes32" }],
  // }] as const;
  //
  // await walletClient.writeContract({
  //   address: ENS_NAME_WRAPPER,
  //   abi: ensNameWrapperAbi,
  //   functionName: "setSubnodeRecord",
  //   args: [
  //     namehash(PARENT_DOMAIN),
  //     username,
  //     ownerAddress as `0x${string}`,
  //     ENS_PUBLIC_RESOLVER,
  //     0n,
  //     0,
  //     BigInt(2 ** 64 - 1),
  //   ],
  // });

  return ensName;
}
