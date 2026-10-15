import { NextRequest, NextResponse } from "next/server";
import { applyUnsubscribe, verifyUnsubscribeToken } from "@/libs/unsubscribe";

export const dynamic = "force-dynamic";

// POST /api/unsubscribe?token=…
//  - RFC 8058 one-click from mail clients (body "List-Unsubscribe=One-Click")
//  - the confirm button on /unsubscribe (form post; token in the body or query)
export async function POST(req: NextRequest) {
  let token = req.nextUrl.searchParams.get("token");
  const isForm = (req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded");
  if (!token && isForm) {
    const form = await req.formData();
    token = String(form.get("token") || "");
  }
  const parsed = verifyUnsubscribeToken(token);
  if (!parsed) return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });

  const ok = await applyUnsubscribe(parsed.kind, parsed.id);
  if (!ok) return NextResponse.json({ error: "Couldn't unsubscribe, please try again" }, { status: 500 });

  // Browser form submit: show the confirmation page; mail-client one-click: plain 200
  const fromPage = req.headers.get("accept")?.includes("text/html");
  if (fromPage) return NextResponse.redirect(new URL(`/unsubscribe?done=1`, req.nextUrl.origin), 303);
  return NextResponse.json({ ok: true });
}
