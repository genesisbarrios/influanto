import { NextResponse, NextRequest } from "next/server";
import supabase from "@/libs/supabase";

// Public endpoint — called from the public Link-in-Bio and Release pages.
// Adds a fan to the page owner's outreach_contacts (deduped by email).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, source, name, email, phone, instagram, tiktok, hp } = body;

    // Honeypot: bots fill hidden fields — silently accept without storing.
    if (hp) return NextResponse.json({ message: "ok" });

    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!username) {
      return NextResponse.json({ error: "Missing page owner" }, { status: 400 });
    }

    // Resolve owner
    const { data: owner } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!owner) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    // Verify the relevant surface actually has signups enabled.
    // (A user may have several release pages — accept if ANY enabled one exists.)
    const table = source === "release_page" ? "release_pages" : "link_in_bio";
    const { data: surface } = await supabase
      .from(table)
      .select("user_id")
      .eq("user_id", owner.id)
      .eq("newsletter_enabled", true)
      .limit(1)
      .maybeSingle();

    if (!surface) {
      return NextResponse.json({ error: "Signups are not enabled" }, { status: 403 });
    }

    const { error } = await supabase
      .from("outreach_contacts")
      .upsert(
        {
          user_id: owner.id,
          email: cleanEmail,
          name: String(name ?? "").trim() || null,
          phone: String(phone ?? "").trim() || null,
          instagram: String(instagram ?? "").trim() || null,
          tiktok: String(tiktok ?? "").trim() || null,
          source: source === "release_page" ? "release_page" : "link_in_bio",
        },
        { onConflict: "user_id,email" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Subscribed" });
  } catch (e: any) {
    console.error("Subscribe error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
