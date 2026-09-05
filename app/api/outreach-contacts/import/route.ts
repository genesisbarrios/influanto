import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { notifyIfNewsletterLimitReached } from "@/libs/newsletter-limit";

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

const FREE_CONTACT_LIMIT = 50;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contacts } = await req.json();
  if (!Array.isArray(contacts) || !contacts.length) {
    return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
  }

  // Normalize + keep only valid emails, deduped within the payload
  const seen = new Set<string>();
  const cleaned = contacts
    .map((c: any) => ({
      name: String(c.name ?? "").trim(),
      email: String(c.email ?? "").trim().toLowerCase(),
      phone: String(c.phone ?? "").trim(),
      instagram: String(c.instagram ?? "").trim(),
      tiktok: String(c.tiktok ?? "").trim(),
    }))
    .filter(c => isEmail(c.email))
    .filter(c => (seen.has(c.email) ? false : (seen.add(c.email), true)));

  if (!cleaned.length) return NextResponse.json({ error: "No valid contacts found" }, { status: 400 });

  // Skip emails that already exist for this user
  const { data: existing } = await supabase
    .from("outreach_contacts")
    .select("email")
    .eq("user_id", session.user.id);
  const existingSet = new Set((existing ?? []).map((e: any) => String(e.email).toLowerCase()));

  const duplicates = cleaned.filter(c => existingSet.has(c.email));
  let toInsert = cleaned.filter(c => !existingSet.has(c.email));

  const { data: userRow } = await supabase.from("users").select("has_access").eq("id", session.user.id).single();
  let capSkipped = 0;
  if (!userRow?.has_access) {
    const room = Math.max(0, FREE_CONTACT_LIMIT - existingSet.size);
    if (toInsert.length > room) {
      capSkipped = toInsert.length - room;
      toInsert = toInsert.slice(0, room);
    }
  }

  if (toInsert.length) {
    const { error } = await supabase
      .from("outreach_contacts")
      .insert(toInsert.map(c => ({ user_id: session.user.id, source: "manual", ...c })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await notifyIfNewsletterLimitReached(session.user.id);
  }

  const message = capSkipped
    ? `Free plan is limited to ${FREE_CONTACT_LIMIT} contacts — ${capSkipped} contact${capSkipped !== 1 ? "s" : ""} skipped. Upgrade to import more.`
    : undefined;
  return NextResponse.json({ added: toInsert.length, skipped: duplicates.length + capSkipped, capSkipped, total: cleaned.length, message });
}
