import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { address } = await req.json();
  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("wallet_addresses, ens_name")
    .eq("id", session.user.id)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing: string[] = user.wallet_addresses ?? [];
  if (!existing.includes(address)) {
    return NextResponse.json({ error: "Wallet not linked to this account" }, { status: 400 });
  }

  const filtered = existing.filter((a) => a !== address);
  const updates: Record<string, any> = { wallet_addresses: filtered };

  // Removing the primary wallet clears the ENS record since the subdomain pointed to it.
  // When influanto.eth is registered the on-chain record would also need updating.
  if (existing[0] === address && user.ens_name) {
    updates.ens_name = null;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.user.id);

  if (updateError) {
    console.error("wallet remove update error:", updateError);
    return NextResponse.json({ error: "Failed to remove wallet" }, { status: 500 });
  }

  const finalEns = "ens_name" in updates ? null : (user.ens_name ?? null);

  return NextResponse.json({
    walletAddresses: filtered,
    ensName: finalEns,
  });
}
