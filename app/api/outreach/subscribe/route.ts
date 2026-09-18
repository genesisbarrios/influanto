import { NextResponse, NextRequest } from "next/server";
import supabase from "@/libs/supabase";
import { notifyIfNewsletterLimitReached, isNewsletterFull } from "@/libs/newsletter-limit";
import { MIN_FORM_FILL_MS, isRateLimited, isDisposableEmail, getRequestIp } from "@/libs/spam-guard";

// Reduces a bare handle, an @handle, or a full profile URL down to just the
// username — the storage convention used everywhere else in the app.
function sanitizeSocialHandle(value: string, domain: string): string {
  let s = String(value ?? "").trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  s = s.replace(new RegExp(`^${domain.replace(".", "\\.")}\\/`, "i"), "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#]/)[0];
  return s.trim();
}

// Public endpoint — called from the public Link-in-Bio and Release pages.
// Adds a fan to the page owner's outreach_contacts (deduped by email).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, source, name, email, phone, instagram, tiktok, hp, renderedAt } = body;

    // Honeypot: bots fill hidden fields — silently accept without storing.
    if (hp) return NextResponse.json({ message: "ok" });

    // Timing check: a bot that fetches the page and posts immediately — or
    // skips rendering the form entirely and hits this endpoint directly —
    // submits far faster than any human could read the form and type an
    // email. Silently accept without storing, same as the honeypot, so a
    // bot can't tell which signal it tripped.
    const elapsedMs = Date.now() - Number(renderedAt ?? 0);
    if (!renderedAt || !Number.isFinite(elapsedMs) || elapsedMs < MIN_FORM_FILL_MS) {
      return NextResponse.json({ message: "ok" });
    }

    const ip = getRequestIp(req);
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
    }

    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (isDisposableEmail(cleanEmail)) {
      return NextResponse.json({ error: "Please use a permanent email address" }, { status: 400 });
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

    if (await isNewsletterFull(owner.id)) {
      return NextResponse.json({ error: "This newsletter isn't accepting new subscribers right now." }, { status: 403 });
    }

    const { error } = await supabase
      .from("outreach_contacts")
      .upsert(
        {
          user_id: owner.id,
          email: cleanEmail,
          name: String(name ?? "").trim() || null,
          phone: String(phone ?? "").trim() || null,
          instagram: sanitizeSocialHandle(instagram, "instagram.com") || null,
          tiktok: sanitizeSocialHandle(tiktok, "tiktok.com") || null,
          source: source === "release_page" ? "release_page" : "link_in_bio",
        },
        { onConflict: "user_id,email" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await notifyIfNewsletterLimitReached(owner.id);

    return NextResponse.json({ message: "Subscribed" });
  } catch (e: any) {
    console.error("Subscribe error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
