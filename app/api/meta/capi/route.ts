import { NextResponse, NextRequest } from "next/server";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

// Server-side Meta Conversions API forwarder. The browser pixel fires the same
// event with the same event_id for deduplication; this copy can't be blocked by
// ad blockers / ITP, so events reliably reach Meta.
export async function POST(req: NextRequest) {
  try {
    const { pixelId, eventName, eventId, eventSourceUrl } = await req.json();
    if (!pixelId || !eventName) return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });

    // The Conversions API token is stored per user, keyed by their pixel id.
    const { data: user } = await supabase
      .from("users")
      .select("meta_capi_token")
      .eq("meta_pixel_id", String(pixelId))
      .maybeSingle();

    const token = user?.meta_capi_token;
    if (!token) return NextResponse.json({ ok: true, skipped: "no CAPI token configured" });

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0].trim();
    const ua = req.headers.get("user-agent") || "";

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
          user_data: {
            ...(ip ? { client_ip_address: ip } : {}),
            client_user_agent: ua,
          },
        },
      ],
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, result: j }, { status: res.ok ? 200 : 502 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
