import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!supabaseKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

// Server-side client using service role key — bypasses RLS for API routes
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
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
