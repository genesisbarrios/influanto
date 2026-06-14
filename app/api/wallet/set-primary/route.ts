import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { updateInfluantoSubnameOwner } from "@/libs/ens";

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
    .select("wallet_addresses, ens_name, username, name")
    .eq("id", session.user.id)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing: string[] = user.wallet_addresses ?? [];
  if (!existing.includes(address)) {
    return NextResponse.json({ error: "Wallet not linked to this account" }, { status: 400 });
  }

  // Move the selected address to index 0 (primary position)
  const reordered = [address, ...existing.filter((a) => a !== address)];

  const { error: updateError } = await supabase
    .from("users")
    .update({ wallet_addresses: reordered })
    .eq("id", session.user.id);

  if (updateError) {
    console.error("set-primary update error:", updateError);
    return NextResponse.json({ error: "Failed to update primary wallet" }, { status: 500 });
  }

  // Update ENS subname ownership to the new primary wallet (no-op until domain is registered)
  if (user.ens_name) {
    const label = user.ens_name.split(".")[0];
    updateInfluantoSubnameOwner(label, address).catch((err) =>
      console.error("ENS subname owner update failed:", err)
    );
  }

  return NextResponse.json({
    walletAddresses: reordered,
    ensName: user.ens_name ?? null,
  });
}
