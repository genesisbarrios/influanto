import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!supabaseKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

// Server-side client using service role key — bypasses RLS for API routes.
// Force no-store on every request so the Next.js App Router Data Cache never
// serves stale rows (public pages like /[slug] would otherwise show old data
// after an edit until revalidation).
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: (input: any, init: any = {}) => fetch(input, { ...init, cache: "no-store" }),
  },
});

export default supabase;

// ── Mappers: DB row (snake_case) → API response (camelCase) ──────────────────

export function mapUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    displayEmail: row.display_email,
    image: row.image,
    location: row.location,
    bio: row.bio,
    website: row.website,
    etsy: row.etsy,
    instagram: row.instagram,
    twitter: row.twitter,
    discord: row.discord,
    telegram: row.telegram,
    facebook: row.facebook,
    linkedin: row.linkedin,
    youtube: row.youtube,
    bluesky: row.bluesky,
    upscrolled: row.upscrolled,
    tiktok: row.tiktok,
    github: row.github,
    spotify: row.spotify,
    appleMusic: row.apple_music,
    tidal: row.tidal,
    amazonMusic: row.amazon_music,
    soundcloud: row.soundcloud,
    deezer: row.deezer,
    pandora: row.pandora,
    bandcamp: row.bandcamp,
    youtubeMusic: row.youtube_music,
    patreon: row.patreon,
    substack: row.substack,
    customerId: row.customer_id,
    priceId: row.price_id,
    hasAccess: row.has_access,
    printifyShopId: row.printify_shop_id,
    printifyConnected: row.printify_connected,
    printifyStoreUrl: row.printify_store_url,
    printifyStoreName: row.printify_store_name,
    printifyAccessToken: row.printify_access_token,
    printifyShopUrl: row.printify_shop_url,
    metaPixelId: row.meta_pixel_id,
    hasMetaCapiToken: !!row.meta_capi_token, // never expose the token itself
    newsletterStyle: row.newsletter_style ?? {},
    walletAddresses: row.wallet_addresses ?? [],
    ensName: row.ens_name ?? null,
    privyUserId: row.privy_user_id ?? null,
  };
}

export function mapLinkInBio(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    bgColor: row.bg_color,
    textColor: row.text_color,
    linksColor: row.links_color,
    cardBgColor: row.card_bg_color,
    font: row.font,
    bgImage: row.bg_image,
    bgMode: row.bg_mode,
    bgImageCustom: row.bg_image_custom,
    patternId: row.pattern_id,
    patternFg: row.pattern_fg,
    patternBg: row.pattern_bg,
    patternOpacity: row.pattern_opacity,
    selectedProducts: row.selected_products ?? [],
    links: row.links ?? [],
    brandLogoUrl: row.brand_logo_url ?? null,
    newsletterEnabled: row.newsletter_enabled ?? false,
    newsletterFields: row.newsletter_fields ?? ["name", "email"],
  };
}

export function mapReleasePage(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    image: row.image,
    description: row.description,
    video: row.video,
    links: row.links ?? [],
    bgColor: row.bg_color,
    textColor: row.text_color,
    linksColor: row.links_color,
    font: row.font,
    selectedProducts: row.selected_products ?? [],
    newsletterEnabled: row.newsletter_enabled ?? false,
    newsletterFields: row.newsletter_fields ?? ["name", "email"],
    brandLogoUrl: row.brand_logo_url ?? null,
    bgMode: row.bg_mode ?? null,
    bgImage: row.bg_image ?? null,
    bgImageCustom: row.bg_image_custom ?? null,
    patternId: row.pattern_id ?? null,
    patternFg: row.pattern_fg ?? null,
    patternBg: row.pattern_bg ?? null,
    patternOpacity: row.pattern_opacity ?? null,
  };
}

export function mapQRCodes(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    codes: row.codes ?? [],
  };
}

// Resolve a list of emails to the Supabase user ids that have an account.
export async function resolveUserIdsByEmails(emails: (string | undefined)[]): Promise<string[]> {
  const clean = Array.from(new Set(
    emails.map((e) => String(e ?? "").trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
  ));
  if (!clean.length) return [];
  const { data } = await supabase.from("users").select("id").in("email", clean);
  return (data ?? []).map((u: any) => u.id);
}

export function mapNewsletter(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? "",
    subject: row.subject ?? "",
    template: row.template ?? "blank",
    image: row.image ?? "",
    description: row.description ?? "",
    links: row.links ?? [],
    bgColor: row.bg_color ?? "",
    textColor: row.text_color ?? "",
    linksColor: row.links_color ?? "",
    urlRedirect: row.url_redirect ?? "",
    html: row.html ?? "",
    status: row.status ?? "draft",
    sentCount: row.sent_count ?? 0,
    lastSentAt: row.last_sent_at ?? null,
    createdAt: row.created_at ?? null,
  };
}

export function mapOutreachContact(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    instagram: row.instagram ?? "",
    tiktok: row.tiktok ?? "",
    source: row.source ?? "manual",
    createdAt: row.created_at ?? null,
  };
}

export function mapCrosspost(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind ?? "image",
    media: row.media ?? [],
    caption: row.caption ?? "",
    platforms: row.platforms ?? [],
    settings: row.settings ?? {},
    status: row.status ?? "draft",
    results: row.results ?? {},
    createdAt: row.created_at ?? null,
  };
}

export function mapCrosspostAccount(row: any) {
  if (!row) return null;
  // Never expose stored credentials to the client.
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    handle: row.handle ?? "",
    connected: row.connected ?? false,
    createdAt: row.created_at ?? null,
  };
}
