import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
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
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "id",      type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getTokenInfo",
    outputs: [
      { internalType: "address", name: "creator",     type: "address" },
      { internalType: "string",  name: "metadataURI", type: "string"  },
      { internalType: "uint256", name: "price",       type: "uint256" },
      { internalType: "uint32",  name: "minted",      type: "uint32"  },
      { internalType: "uint32",  name: "maxEditions", type: "uint32"  },
      { internalType: "bool",    name: "exists",      type: "bool"    },
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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Wallet address can be passed from the client (Privy wallet address)
  // or we fall back to stored wallet_addresses on the user row.
  const { searchParams } = new URL(req.url);
  const clientWallet = searchParams.get("wallet");

  let walletAddresses: string[] = [];

  if (clientWallet && ethers.isAddress(clientWallet)) {
    walletAddresses = [clientWallet];
  } else {
    const { data: userRow } = await supabase
      .from("users")
      .select("wallet_addresses")
      .eq("id", session.user.id)
      .single();
    walletAddresses = (userRow?.wallet_addresses ?? []).filter(ethers.isAddress);
  }

  if (walletAddresses.length === 0) {
    return NextResponse.json({ collectibles: [], noWallet: true });
  }

  try {
    const provider = new ethers.JsonRpcProvider(AMOY_RPC, 80002);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    // Get total number of tokens minted on the contract
    const nextId = Number(await contract.nextId());
    const total  = nextId - 1;
    if (total <= 0) return NextResponse.json({ collectibles: [] });

    const tokenIds = Array.from({ length: total }, (_, i) => i + 1);

    // Check balanceOf for each wallet address across all token IDs in parallel
    const owned = new Set<number>();
    await Promise.all(
      walletAddresses.flatMap((wallet) =>
        tokenIds.map(async (id) => {
          try {
            const bal = await contract.balanceOf(wallet, id);
            if (Number(bal) > 0) owned.add(id);
          } catch {}
        })
      )
    );

    if (owned.size === 0) return NextResponse.json({ collectibles: [] });

    // Pull DB metadata for tokens that exist there (for image/audio fallback)
    const ownedIds = Array.from(owned).map(String);
    const { data: dbRows } = await supabase
      .from("collectibles")
      .select("token_id, title, audio_url, image_url, artist, genres, edition_size")
      .in("token_id", ownedIds)
      .eq("network", "polygon");

    const dbMap = new Map((dbRows ?? []).map((r: any) => [String(r.token_id), r]));

    // Fetch on-chain info + Walrus metadata for each owned token
    const collectibles = await Promise.all(
      Array.from(owned).map(async (tokenId) => {
        try {
          const [creator, metadataURI, price, minted, maxEditions, exists] =
            await contract.getTokenInfo(tokenId);
          if (!exists) return null;

          const meta = metadataURI ? await fetchMetadata(metadataURI) : {};
          const db   = dbMap.get(String(tokenId));

          return {
            tokenId,
            creator,
            priceMatic:  ethers.formatEther(price),
            minted:      Number(minted),
            maxEditions: Number(maxEditions),
            available:   Number(maxEditions) - Number(minted),
            title:       meta.name          ?? db?.title       ?? `Collectible #${tokenId}`,
            description: meta.description   ?? "",
            imageUrl:    meta.image         ?? db?.image_url   ?? "",
            audioUrl:    meta.animation_url ?? db?.audio_url   ?? "",
            artist:      meta.artist        ?? db?.artist      ?? "",
            genres:      meta.genres        ?? (Array.isArray(db?.genres) ? db.genres.join(", ") : ""),
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ collectibles: collectibles.filter(Boolean) });
  } catch (err: any) {
    console.error("collectibles/mine error:", err?.message);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch your collection" },
      { status: 500 }
    );
  }
}
