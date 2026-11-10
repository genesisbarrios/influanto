// Split sheet delivery tracking. Each signer row keeps the latest time of each
// event (fast to show in lists); split_sheet_events keeps the full history.
import supabase from "@/libs/supabase";

export type SplitSheetEventType = "sent" | "opened" | "clicked" | "viewed" | "edited" | "signed";

const SIGNER_COLUMN: Partial<Record<SplitSheetEventType, string>> = {
  sent: "last_sent_at",
  opened: "opened_at",
  clicked: "clicked_at",
  viewed: "viewed_at",
  edited: "edited_at",
  // signed_at is written by the sign route itself
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

// Link scanners and prefetchers would otherwise inflate opens/clicks.
// (Gmail's image proxy is a real open, so it isn't filtered.)
export const isBotUserAgent = (ua: string) =>
  /bot|crawl|spider|scraper|preview|monitor|curl|wget|python|go-http|headless|safelinks|barracuda|proofpoint|mimecast/i.test(ua);

/** Record an event. Never throws: tracking must not break sending or signing. */
export async function recordSplitSheetEvent(
  splitSheetId: string,
  signerId: string | null,
  type: SplitSheetEventType,
  at: string = new Date().toISOString()
) {
  try {
    await supabase.from("split_sheet_events").insert({ split_sheet_id: splitSheetId, signer_id: signerId, type, created_at: at });
    const col = SIGNER_COLUMN[type];
    if (signerId && col) await supabase.from("split_sheet_signers").update({ [col]: at }).eq("id", signerId);
  } catch (e: any) {
    console.error(`split sheet event (${type}) failed:`, e?.message);
  }
}

/** Look up the signer behind a signing token (id + sheet only). */
export async function signerByToken(token: string) {
  if (!isUuid(token)) return null;
  const { data } = await supabase
    .from("split_sheet_signers")
    .select("id, split_sheet_id")
    .eq("token", token)
    .maybeSingle();
  return data ?? null;
}
