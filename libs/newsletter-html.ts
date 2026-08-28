// Renders an email-safe HTML newsletter from structured content.
// Used both by the send route (libs/resend) and the dashboard live preview,
// so the email a contact receives always matches what the creator sees.

export interface NLLink {
  name?: string;
  url?: string;
  type?: string;
  id?: string;
  image?: string;
  price?: string;
}

export interface NewsletterContent {
  title?: string;
  subject?: string;
  template?: string;
  image?: string;
  description?: string;
  links?: NLLink[];
  bgColor?: string;
  textColor?: string;
  linksColor?: string;
  urlRedirect?: string;
  newsletterEnabled?: boolean;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  spotify?: string;
  soundcloud?: string;
  youtubeMusic?: string;
  website?: string;
}

function buildSocialUrl(platform: keyof SocialLinks, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (platform === "facebook" || platform === "website") return safeUrl(v);
  if (platform === "instagram") return `https://instagram.com/${v}`;
  if (platform === "twitter") return `https://twitter.com/${v}`;
  if (platform === "tiktok") return `https://tiktok.com/@${v}`;
  if (platform === "youtube") return `https://youtube.com/@${v}`;
  if (platform === "youtubeMusic") return `https://music.youtube.com/channel/${v}`;
  if (platform === "soundcloud") return `https://soundcloud.com/${v}`;
  if (platform === "spotify") return `https://open.spotify.com/artist/${v}`;
  return safeUrl(v);
}

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Allow only http/https/mailto links to avoid javascript: injection in emails.
function safeUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (u && !/^[a-z]+:/i.test(u)) return `https://${u}`;
  return "#";
}

const TEMPLATE_LABELS: Record<string, string> = {
  blank: "",
  song_release: "🎵 New Song",
  album_release: "💿 New Album",
  music_video_release: "🎬 New Music Video",
};

const SOCIAL_META: Record<keyof SocialLinks, { label: string; icon: string }> = {
  instagram: { label: "Instagram", icon: "instagram.svg" },
  twitter: { label: "Twitter", icon: "twitter.svg" },
  facebook: { label: "Facebook", icon: "facebook.svg" },
  youtube: { label: "YouTube", icon: "youtube.svg" },
  tiktok: { label: "TikTok", icon: "tiktok.svg" },
  spotify: { label: "Spotify", icon: "spotify.svg" },
  soundcloud: { label: "SoundCloud", icon: "soundcloud.svg" },
  youtubeMusic: { label: "YouTube Music", icon: "youtube-music.svg" },
  website: { label: "Website", icon: "website.svg" },
};

const ICON_BASE = "https://www.influanto.com/social-icons/";

export function renderNewsletterHtml(
  n: NewsletterContent,
  opts: { senderName?: string; socials?: SocialLinks; artistImage?: string; username?: string } = {}
): string {
  const bg = n.bgColor || "#0f0f12";
  const text = n.textColor || "#ffffff";
  const accent = n.linksColor || "#4f46e5";
  const senderName = opts.senderName || "An artist";
  const badge = TEMPLATE_LABELS[n.template || "blank"] || "";

  const image = n.image
    ? `<img src="${escapeHtml(n.image)}" alt="${escapeHtml(n.title || "")}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px;margin-bottom:24px;" />`
    : "";

  const heading = n.title
    ? `<h1 style="font-size:26px;font-weight:800;margin:0 0 12px;color:${text};">${escapeHtml(n.title)}</h1>`
    : "";

  const badgeHtml = badge
    ? `<p style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${accent};margin:0 0 8px;">${escapeHtml(badge)}</p>`
    : "";

  const description = n.description
    ? `<p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:${text};opacity:.9;white-space:pre-wrap;">${escapeHtml(n.description)}</p>`
    : "";

  const allLinks = (n.links || []).filter((l) => l && (l.url || l.name));
  const regularLinks = allLinks.filter((l) => l.type !== "merch" && l.type !== "youtube");
  const merchLinks = allLinks.filter((l) => l.type === "merch");
  const youtubeEntry = allLinks.find((l) => l.type === "youtube");

  const youtubeBlock = (() => {
    if (!youtubeEntry?.url) return "";
    const rawUrl = youtubeEntry.url;
    const url = safeUrl(rawUrl);
    const videoIdMatch = rawUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    const playlistIdMatch = rawUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;

    if (videoId) {
      const thumb = `https://img.youtube.com/vi/${escapeHtml(videoId)}/maxresdefault.jpg`;
      // Email-safe: thumbnail as table cell background with a centered play button overlay.
      // Gmail/Outlook strip iframes, so this approach works in every client.
      // Clicking opens YouTube where the video plays.
      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:20px;border-radius:12px;overflow:hidden;"><tr><td background="${thumb}" style="background-image:url('${thumb}');background-size:cover;background-position:center center;background-repeat:no-repeat;border-radius:12px;" align="center" valign="middle" height="315"><a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;width:72px;height:72px;background:rgba(0,0,0,0.72);border-radius:50%;text-align:center;line-height:72px;text-decoration:none;font-size:34px;color:#ffffff;">&#9654;</a></td></tr></table>`;
    }

    if (playlistId) {
      return `<div style="text-align:center;margin-bottom:20px;"><a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:12px 28px;background:#FF0000;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">&#9654;&nbsp;Watch Playlist</a></div>`;
    }

    return "";
  })();

  const links = regularLinks
    .map(
      (l) => `
        <a href="${escapeHtml(safeUrl(l.url || ""))}" target="_blank"
          style="display:block;padding:14px 20px;margin:0 0 12px;background:${accent};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;text-align:center;">
          ${escapeHtml(l.name || l.url || "Open")}
        </a>`
    )
    .join("");

  const merchGrid = merchLinks.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 12px;">
        <tr><td colspan="2" style="padding-bottom:10px;font-size:13px;font-weight:700;color:${text};opacity:.7;text-transform:uppercase;letter-spacing:.5px;">🛒 Merch</td></tr>
        ${merchLinks.map((l, i) => {
          const isEven = i % 2 === 0;
          const cell = `<td width="50%" style="padding:${isEven ? "0 6px 12px 0" : "0 0 12px 6px"};vertical-align:top;">
            <a href="${escapeHtml(safeUrl(l.url || ""))}" target="_blank" style="text-decoration:none;display:block;background:#ffffff10;border-radius:10px;overflow:hidden;border:1px solid ${text}22;">
              ${l.image ? `<img src="${escapeHtml(l.image)}" alt="${escapeHtml(l.name || "")}" width="100%" style="display:block;width:100%;height:140px;object-fit:cover;" />` : `<div style="height:100px;background:${accent}22;"></div>`}
              <div style="padding:10px;">
                <div style="font-size:13px;font-weight:700;color:${text};line-height:1.3;margin-bottom:4px;">${escapeHtml(l.name || "Product")}</div>
                ${l.price ? `<div style="font-size:12px;color:${accent};font-weight:600;margin-bottom:8px;">$${escapeHtml(l.price)}</div>` : ""}
                <span style="display:inline-block;padding:5px 12px;background:${accent};color:#fff;font-size:11px;font-weight:700;border-radius:6px;">Shop Now</span>
              </div>
            </a>
          </td>`;
          if (isEven) return `<tr>${cell}`;
          return `${cell}</tr>`;
        }).join("")}
        ${merchLinks.length % 2 !== 0 ? `<td width="50%"></td></tr>` : ""}
      </table>`
    : "";

  // The header block (image + badge + heading + description). If a URL Redirect
  // is set, the whole block becomes a single clickable link to that destination.
  const headerInner = `${image}${badgeHtml}${heading}${description}`;
  const redirect = n.urlRedirect ? safeUrl(n.urlRedirect) : "";
  const headerBlock = redirect && redirect !== "#"
    ? `<a href="${escapeHtml(redirect)}" target="_blank" style="text-decoration:none;color:inherit;display:block;">${headerInner}</a>`
    : headerInner;

  const socialIcons = Object.entries(SOCIAL_META)
    .filter(([key]) => opts.socials?.[key as keyof SocialLinks])
    .map(([key, meta]) => {
      const url = buildSocialUrl(key as keyof SocialLinks, opts.socials![key as keyof SocialLinks]!);
      const iconSrc = `${ICON_BASE}${meta.icon}`;
      return `<a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;margin:0 5px;text-decoration:none;"><img src="${escapeHtml(iconSrc)}" alt="${escapeHtml(meta.label)}" width="36" height="36" style="display:inline-block;width:36px;height:36px;border-radius:50%;" /></a>`;
    })
    .join("");

  const socialRow = socialIcons
    ? `<div style="text-align:center;margin:28px 0 12px;">${socialIcons}</div>`
    : "";

  const artistLogo = opts.artistImage
    ? `<div style="text-align:center;margin:12px 0 16px;"><img src="${escapeHtml(opts.artistImage)}" alt="${escapeHtml(senderName)}" width="60" height="60" style="border-radius:50%;width:60px;height:60px;object-fit:cover;display:inline-block;" /></div>`
    : "";

  // A real embedded signup form can't run in email (Gmail/Outlook strip
  // forms and scripts like they strip iframes), so this links out to the
  // artist's hosted signup page instead — same destination the "Collect
  // newsletter signups" toggle uses on release pages.
  const newsletterCta = n.newsletterEnabled && opts.username
    ? `<div style="text-align:center;margin:24px 0 0;padding:20px;background:${accent}14;border-radius:12px;">
        <p style="font-size:14px;font-weight:700;margin:0 0 4px;color:${text};">📬 Want more like this?</p>
        <p style="font-size:13px;margin:0 0 14px;color:${text};opacity:.8;">Subscribe for future updates from ${escapeHtml(senderName)}.</p>
        <a href="https://influanto.com/embed/newsletter/${escapeHtml(opts.username)}" target="_blank" style="display:inline-block;padding:10px 22px;background:${accent};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Subscribe</a>
      </div>`
    : "";

  const footerTopMargin = socialRow || artistLogo || newsletterCta ? "12px" : "28px";

  return `
  <div style="background:${bg};padding:32px 16px;margin:0;">
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      ${headerBlock}
      ${youtubeBlock}
      ${links}
      ${merchGrid}
      ${newsletterCta}
      ${socialRow}
      ${artistLogo}
      <p style="font-size:12px;color:${text};opacity:.55;margin:${footerTopMargin} 0 0;text-align:center;">
        Sent by ${escapeHtml(senderName)} via <a href="https://influanto.com" style="color:${accent};text-decoration:none;">Influanto</a>
      </p>
    </div>
  </div>`;
}

// Per-recipient tracking injection, applied at SEND time (not stored).
// Rewrites every http(s) link to pass through the click tracker, and appends a
// 1x1 open-tracking pixel — both carry the newsletter id + contact id.
export function injectEmailTracking(
  html: string,
  opts: { base: string; newsletterId: string; contactId: string }
): string {
  const { base, newsletterId, contactId } = opts;
  const q = `n=${encodeURIComponent(newsletterId)}&c=${encodeURIComponent(contactId)}`;

  const tracked = html.replace(/href="(https?:\/\/[^"]+)"/g, (_m, url) => {
    // The url was HTML-escaped at render time; restore &amp; before encoding.
    const clean = String(url).replace(/&amp;/g, "&");
    return `href="${base}/api/outreach/track/click?${q}&u=${encodeURIComponent(clean)}"`;
  });

  const pixel = `<img src="${base}/api/outreach/track/open?${q}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
  return `${tracked}${pixel}`;
}
