import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { getEnsNameForAddress, createInfluantoSubname } from "@/libs/ens";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json();
    const { address, privyUserId } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("wallet_addresses, ens_name, privy_user_id, username, name")
      .eq("id", session.user.id)
      .single();

    if (fetchError || !user) {
      console.error("wallet/save — user fetch failed:", fetchError?.message ?? "no user row");
      return NextResponse.json(
        { error: fetchError?.message ?? "User not found" },
        { status: 404 }
      );
    }

    const existing: string[] = user.wallet_addresses ?? [];
    const updates: Record<string, any> = {};

    if (!existing.includes(address)) {
      updates.wallet_addresses = [...existing, address];
    }

    if (privyUserId && !user.privy_user_id) {
      updates.privy_user_id = privyUserId;
    }

    // Save wallet immediately — don't block on ENS lookup
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", session.user.id);

      if (updateError) {
        console.error("wallet/save — update failed:", updateError.message, updateError.details, updateError.hint);
        return NextResponse.json({ error: "Failed to save wallet", detail: updateError.message }, { status: 500 });
      }
    }

    // ENS lookup runs in the background after the response is sent
    const needsEns = !user.ens_name && address.startsWith("0x");
    if (needsEns) {
      resolveAndSaveEns(session.user.id, address, user.username, user.name).catch((err) =>
        console.error("wallet/save — ENS background lookup failed:", err?.message)
      );
    }

    const finalAddresses = updates.wallet_addresses ?? existing;
    const finalEns = user.ens_name ?? null; // ENS populates asynchronously

    return NextResponse.json({
      walletAddresses: finalAddresses,
      ensName: finalEns,
    });
  } catch (err: any) {
    console.error("wallet/save — unexpected error:", err?.message, err?.stack);
    return NextResponse.json({ error: "Unexpected server error", detail: err?.message }, { status: 500 });
  }
}

async function resolveAndSaveEns(
  userId: string,
  address: string,
  username: string | null,
  name: string | null
): Promise<void> {
  let ensName: string | null = null;

  try {
    ensName = await getEnsNameForAddress(address);
  } catch {
    // ignore — falls through to influanto subname
  }

  if (!ensName) {
    const handle = username || name?.replace(/\s+/g, "-") || address.slice(2, 8);
    try {
      ensName = await createInfluantoSubname(handle, address);
    } catch {
      return;
    }
  }

  if (ensName) {
    const { error } = await supabase
      .from("users")
      .update({ ens_name: ensName })
      .eq("id", userId);
    if (error) console.error("wallet/save — ENS update failed:", error.message);
  }
}
