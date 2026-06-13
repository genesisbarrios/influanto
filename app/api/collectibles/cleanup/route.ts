import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

// Removes duplicate Supabase collectible rows for the logged-in user.
// Keeps the row with a token_id if one exists, otherwise the newest.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from("collectibles")
      .select("id, title, token_id, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Group by lower-cased title
    const byTitle = new Map<string, typeof rows>();
    for (const row of rows ?? []) {
      const key = row.title.toLowerCase().trim();
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key)!.push(row);
    }

    const toDelete: string[] = [];
    for (const [, group] of byTitle) {
      if (group.length <= 1) continue;
      // Keep the one with a token_id (confirmed on-chain), or the first (newest)
      const keeper = group.find(r => r.token_id) ?? group[0];
      for (const r of group) {
        if (r.id !== keeper.id) toDelete.push(r.id);
      }
    }

    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("collectibles")
        .delete()
        .in("id", toDelete);
      if (delError) throw new Error(delError.message);
    }

    return NextResponse.json({ deleted: toDelete.length });
  } catch (err: any) {
    console.error("cleanup error:", err);
    return NextResponse.json({ error: err?.message ?? "Cleanup failed" }, { status: 500 });
  }
}
