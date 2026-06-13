import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("wallet_addresses, ens_name, privy_user_id")
    .eq("id", session.user.id)
    .single();

  if (error || !user) {
    console.error("wallet/info — user fetch failed:", error?.message ?? "no user row");
    return NextResponse.json(
      { error: error?.message ?? "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    walletAddresses: user.wallet_addresses ?? [],
    ensName: user.ens_name ?? null,
    privyUserId: user.privy_user_id ?? null,
  });
}
