// ads.txt for Google AdSense, generated from the publisher ID so it can't drift
// out of sync with the ad code. Serves an empty file until the ID is set.
import { ADSENSE_CLIENT } from "@/libs/ads";

export const dynamic = "force-static";

export function GET() {
  const client = ADSENSE_CLIENT;
  const pub = client.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
