import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import {
  CUSTOM_DOMAIN_LIMIT, normalizeDomain, dnsRecordFor,
  addProjectDomain, removeProjectDomain, getDomainStatus,
} from "@/libs/customDomains";

export const dynamic = "force-dynamic";

async function currentRow(userId: string) {
  const { data } = await supabase.from("custom_domains").select().eq("user_id", userId).maybeSingle();
  return data;
}

// What the dashboard shows: the domain, the DNS record to add, and whether it's live.
// Checking also refreshes the stored "verified" flag the domain router relies on.
async function describe(row: any) {
  if (!row) return { domain: null };
  let status = { verified: !!row.verified, verification: [] as any[] };
  let checkError: string | undefined;
  try {
    status = await getDomainStatus(row.domain);
    if (status.verified !== !!row.verified) {
      await supabase.from("custom_domains").update({ verified: status.verified }).eq("id", row.id);
    }
  } catch (e: any) {
    checkError = e?.message || "Could not check the domain";
  }
  return { domain: row.domain, verified: status.verified, dns: dnsRecordFor(row.domain), verification: status.verification, checkError };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ data: await describe(await currentRow(session.user.id)) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { data: userRow } = await supabase.from("users").select("has_access").eq("id", userId).single();
  if (!userRow?.has_access) {
    return NextResponse.json({ error: "Custom domains are a Pro feature." }, { status: 403 });
  }

  const { domain: input } = await req.json().catch(() => ({}));
  const domain = normalizeDomain(input);
  if (!domain) return NextResponse.json({ error: "Enter a domain like links.yourname.com" }, { status: 400 });

  const existing = await currentRow(userId);
  if (existing?.domain === domain) return NextResponse.json({ data: await describe(existing) });

  const { data: taken } = await supabase.from("custom_domains").select("user_id").eq("domain", domain).maybeSingle();
  if (taken && taken.user_id !== userId) {
    return NextResponse.json({ error: "That domain is already connected to another Influanto account." }, { status: 409 });
  }

  // Replacing their domain frees its slot, so only count when adding a new one
  if (!existing) {
    const { count } = await supabase.from("custom_domains").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= CUSTOM_DOMAIN_LIMIT) {
      return NextResponse.json({ error: "Custom domains are full right now. Please try again soon." }, { status: 503 });
    }
  }

  try {
    await addProjectDomain(domain);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not add the domain" }, { status: 400 });
  }

  if (existing) {
    await removeProjectDomain(existing.domain).catch((e) => console.error("custom domain: remove old failed:", e?.message));
  }

  const { data: row, error } = await supabase
    .from("custom_domains")
    .upsert({ user_id: userId, domain, verified: false }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) {
    await removeProjectDomain(domain).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: await describe(row) }, { status: 201 });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await currentRow(session.user.id);
  if (!row) return NextResponse.json({ data: { domain: null } });

  try {
    await removeProjectDomain(row.domain);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not remove the domain" }, { status: 500 });
  }
  await supabase.from("custom_domains").delete().eq("id", row.id);
  return NextResponse.json({ data: { domain: null } });
}
