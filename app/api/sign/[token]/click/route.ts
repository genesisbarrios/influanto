import { NextRequest, NextResponse } from "next/server";
import { isBotUserAgent, isUuid, recordSplitSheetEvent, signerByToken } from "@/libs/splitSheetEvents";

export const dynamic = "force-dynamic";

// GET /api/sign/<token>/click?to=sign|login: records the click from the email,
// then redirects. Destinations are fixed (never taken from the query string),
// so this can't be used as an open redirect.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const origin = new URL(req.url).origin;
  if (!isUuid(params.token)) return NextResponse.redirect(origin);

  const signPath = `/sign/${params.token}`;
  const dest = new URL(req.url).searchParams.get("to") === "login"
    ? `${origin}/api/auth/signin?callbackUrl=${encodeURIComponent(signPath)}`
    : `${origin}${signPath}`;

  try {
    if (!isBotUserAgent(req.headers.get("user-agent") || "")) {
      const signer = await signerByToken(params.token);
      if (signer) await recordSplitSheetEvent(signer.split_sheet_id, signer.id, "clicked");
    }
  } catch (e) {
    console.error("split sheet click tracking error", e);
  }
  return NextResponse.redirect(dest, 302);
}
