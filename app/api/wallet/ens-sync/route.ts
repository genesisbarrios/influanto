import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { getEnsNameForAddress } from "@/libs/ens";

export const dynamic = "force-dynamic";

const INFLUANTO_SUFFIX = ".influanto.eth";

// GET /api/wallet/ens-sync?address=0x...
// Resolves the given wallet address's ENS name and saves it to the DB.
// Replaces an influanto subname if a real .eth name is found.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const address = req.nextUrl.searchParams.get("address");
    if (!address) return NextResponse.json({ ensName: null });

    console.log("ens-sync — looking up:", address);

    // Skip if user already has a personal ENS name saved
    const { data: user } = await supabase
      .from("users")
      .select("ens_name")
      .eq("id", session.user.id)
      .single();

    if (user?.ens_name && !user.ens_name.endsWith(INFLUANTO_SUFFIX)) {
      console.log("ens-sync — already set:", user.ens_name);
      return NextResponse.json({ ensName: user.ens_name });
    }

    const resolved = await getEnsNameForAddress(address);
    console.log("ens-sync — resolved:", resolved);

    if (!resolved) {
      return NextResponse.json({ ensName: user?.ens_name || null });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ ens_name: resolved })
      .eq("id", session.user.id);

    if (updateError) {
      console.error("ens-sync — update failed:", updateError.message);
    }

    return NextResponse.json({ ensName: resolved });
  } catch (err: any) {
    console.error("ens-sync — unexpected error:", err?.message);
    return NextResponse.json({ ensName: null });
  }
}
