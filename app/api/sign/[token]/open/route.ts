import { NextRequest } from "next/server";
import { isBotUserAgent, recordSplitSheetEvent, signerByToken } from "@/libs/splitSheetEvents";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// GET /api/sign/<token>/open: open-tracking pixel in the split sheet email
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    if (!isBotUserAgent(req.headers.get("user-agent") || "")) {
      const signer = await signerByToken(params.token);
      if (signer) await recordSplitSheetEvent(signer.split_sheet_id, signer.id, "opened");
    }
  } catch (e) {
    console.error("split sheet open tracking error", e);
  }
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
