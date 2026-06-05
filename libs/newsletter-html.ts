// Renders an email-safe HTML newsletter from structured content.
// Used both by the send route (libs/resend) and the dashboard live preview,
// so the email a contact receives always matches what the creator sees.

export interface NewsletterContent {
  title?: string;
  subject?: string;
  template?: string;
  image?: string;
  description?: string;
  links?: { name?: string; url?: string }[];
  bgColor?: string;
  textColor?: string;
  linksColor?: string;
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

export function renderNewsletterHtml(
  n: NewsletterContent,
  opts: { senderName?: string } = {}
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

  const links = (n.links || [])
    .filter((l) => l && (l.url || l.name))
    .map(
      (l) => `
        <a href="${escapeHtml(safeUrl(l.url || ""))}" target="_blank"
          style="display:block;padding:14px 20px;margin:0 0 12px;background:${accent};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;text-align:center;">
          ${escapeHtml(l.name || l.url || "Open")}
        </a>`
    )
    .join("");

  return `
  <div style="background:${bg};padding:32px 16px;margin:0;">
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      ${image}
      ${badgeHtml}
      ${heading}
      ${description}
      ${links}
      <p style="font-size:12px;color:${text};opacity:.55;margin:28px 0 0;text-align:center;">
        Sent by ${escapeHtml(senderName)} via <a href="https://influanto.com" style="color:${accent};text-decoration:none;">Influanto</a>
      </p>
    </div>
  </div>`;
}
