import { NextRequest, NextResponse } from "next/server";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

// GET /api/outreach/track/click?n=<newsletterId>&c=<contactId>&u=<encoded url>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const newsletterId = searchParams.get("n");
  const contactId = searchParams.get("c");
  const rawUrl = searchParams.get("u") || "";

  // Only allow http/https redirects; never trust the param blindly.
  let dest = "https://influanto.com";
  if (/^https?:\/\//i.test(rawUrl)) dest = rawUrl;

  try {
    if (newsletterId) {
      const { data: nl } = await supabase
        .from("newsletters")
        .select("user_id")
        .eq("id", newsletterId)
        .single();
      if (nl) {
        await supabase.from("newsletter_events").insert({
          newsletter_id: newsletterId,
          user_id: nl.user_id,
          contact_id: contactId || null,
          type: "click",
          url: dest,
        });
      }
    }
  } catch (e) {
    console.error("click tracking error", e);
  }

  return NextResponse.redirect(dest, 302);
}
