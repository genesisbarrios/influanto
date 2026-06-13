import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { getEnsNameForAddress, createInfluantoSubname } from "@/libs/ens";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { address, privyUserId } = body;

  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  // Fetch current wallet state
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("wallet_addresses, ens_name, privy_user_id, username, name")
    .eq("id", session.user.id)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing: string[] = user.wallet_addresses ?? [];
  const updates: Record<string, any> = {};

  // Add address if not already linked
  if (!existing.includes(address)) {
    updates.wallet_addresses = [...existing, address];
  }

  // Store Privy user ID on first link
  if (privyUserId && !user.privy_user_id) {
    updates.privy_user_id = privyUserId;
  }

  // Assign ENS name if not set yet and address is EVM
  if (!user.ens_name && address.startsWith("0x")) {
    const existingEns = await getEnsNameForAddress(address);
    if (existingEns) {
      updates.ens_name = existingEns;
    } else {
      const handle = user.username || user.name?.replace(/\s+/g, "-") || address.slice(2, 8);
      updates.ens_name = await createInfluantoSubname(handle, address);
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id);

    if (updateError) {
      console.error("Failed to update user:", updateError);
      return NextResponse.json({ error: "Failed to save wallet" }, { status: 500 });
    }
  }

  const finalAddresses = updates.wallet_addresses ?? existing;
  const finalEns = updates.ens_name ?? user.ens_name ?? null;

  return NextResponse.json({
    walletAddresses: finalAddresses,
    ensName: finalEns,
  });
}
