import { NextRequest } from "next/server";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function gif() {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

// GET /api/outreach/track/open?n=<newsletterId>&c=<contactId>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const newsletterId = searchParams.get("n");
    const contactId = searchParams.get("c");
    const ua = req.headers.get("user-agent") || "";

    // Ignore obvious link-scanner / prefetch bots so opens aren't inflated.
    const isBot = /bot|crawl|spider|scraper|preview|monitor|curl|wget|python|go-http/i.test(ua);

    if (newsletterId && !isBot) {
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
          type: "open",
        });
      }
    }
  } catch (e) {
    console.error("open tracking error", e);
  }
  return gif();
}
