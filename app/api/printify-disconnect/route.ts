import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await supabase.from("users").update({
      printify_shop_id: null,
      printify_connected: false,
      printify_store_url: null,
      printify_store_name: null,
    }).eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Successfully disconnected from Printify" });
  } catch (error) {
    console.error("❌ Disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect from Printify" }, { status: 500 });
  }
}
