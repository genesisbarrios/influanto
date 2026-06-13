import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS!;
const AMOY_RPC = "https://rpc-amoy.polygon.technology";

const ABI = [
  {
    inputs: [],
    name: "nextId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getTokenInfo",
    outputs: [
      { internalType: "address",  name: "creator",     type: "address"  },
      { internalType: "string",   name: "metadataURI", type: "string"   },
      { internalType: "uint256",  name: "price",       type: "uint256"  },
      { internalType: "uint32",   name: "minted",      type: "uint32"   },
      { internalType: "uint32",   name: "maxEditions", type: "uint32"   },
      { internalType: "bool",     name: "exists",      type: "bool"     },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function fetchMetadata(uri: string): Promise<Record<string, any>> {
  try {
    const res = await fetch(uri, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function GET() {
  if (!CONTRACT_ADDRESS) {
    return NextResponse.json({ error: "Contract address not configured" }, { status: 500 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(AMOY_RPC, 80002);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const nextId = Number(await contract.nextId());
    const total = nextId - 1;

    if (total <= 0) {
      return NextResponse.json({ collectibles: [] });
    }

    // Fetch all token info from the contract in parallel
    const tokenInfoResults = await Promise.allSettled(
      Array.from({ length: total }, (_, i) => contract.getTokenInfo(i + 1))
    );

    // Fetch all metadata from Walrus in parallel
    const collectibles = await Promise.all(
      tokenInfoResults.map(async (result, i) => {
        if (result.status === "rejected") return null;

        const [creator, metadataURI, price, minted, maxEditions, exists] = result.value;
        if (!exists) return null;

        const meta = metadataURI ? await fetchMetadata(metadataURI) : {};

        return {
          tokenId:     i + 1,
          creator,
          metadataURI,
          priceWei:    price.toString(),
          priceMatic:  ethers.formatEther(price),
          minted:      Number(minted),
          maxEditions: Number(maxEditions),
          available:   Number(maxEditions) - Number(minted),
          // From Walrus metadata
          title:       meta.name        ?? `Collectible #${i + 1}`,
          description: meta.description ?? "",
          imageUrl:    meta.image        ?? "",
          audioUrl:    meta.animation_url ?? "",
          artist:      meta.artist       ?? "",
          genres:      meta.genres       ?? "",
        };
      })
    );

    return NextResponse.json({
      collectibles: collectibles.filter(Boolean),
    });
  } catch (err: any) {
    console.error("chain/collectibles error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch from chain" }, { status: 500 });
  }
}
