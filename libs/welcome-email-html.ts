// Renders the onboarding email sent a day or two after signup, nudging new
// users to finish setting up their profile, Link in Bio, and first Release
// Page. Mirrors the dark, card-free style used in libs/newsletter-html.ts.

const BG = "#0f0f12";
const TEXT = "#ffffff";
const ACCENT = "#09ecf3";
const ACCENT_TEXT = "#003638";

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(label: string, href: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
      <tr>
        <td style="border-radius:10px;background:${ACCENT};">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;color:${ACCENT_TEXT};text-decoration:none;font-weight:800;font-size:15px;border-radius:10px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function featureSection(opts: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
}): string {
  return `
    <div style="margin:0 0 40px;">
      <p style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${ACCENT};margin:0 0 8px;text-align:center;">
        ${escapeHtml(opts.eyebrow)}
      </p>
      <h2 style="font-size:22px;font-weight:800;margin:0 0 10px;color:${TEXT};text-align:center;">
        ${escapeHtml(opts.title)}
      </h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:${TEXT};opacity:.85;text-align:center;">
        ${escapeHtml(opts.description)}
      </p>
      <img src="${opts.image}" alt="${escapeHtml(opts.title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px;margin:0 0 20px;" />
      ${button(opts.ctaLabel, opts.ctaHref)}
    </div>`;
}

export function renderWelcomeEmailHtml(opts: { name?: string }): string {
  const firstName = (opts.name || "").trim().split(" ")[0];
  const greeting = firstName ? `Hey ${escapeHtml(firstName)},` : "Hey there,";
  const dashboardUrl = "https://influanto.com/dashboard";
  const imageBase = "https://www.influanto.com/pitch-deck";

  return `
  <div style="background:${BG};padding:40px 16px;margin:0;">
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

      <p style="text-align:center;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${TEXT};opacity:.6;margin:0 0 24px;">
        influanto
      </p>

      <h1 style="font-size:28px;font-weight:800;margin:0 0 16px;color:${TEXT};text-align:center;">
        Welcome to Influanto 👋
      </h1>

      <p style="font-size:16px;line-height:1.6;margin:0 0 8px;color:${TEXT};">
        ${greeting}
      </p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 32px;color:${TEXT};opacity:.9;">
        You're all signed up — now let's get your page ready to share. Here's what most artists set up first:
      </p>

      <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin:0 0 40px;background:#ffffff0d;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="font-size:15px;line-height:1.9;margin:0;color:${TEXT};">
              <span style="color:${ACCENT};font-weight:800;">1.</span> Finish your <a href="${dashboardUrl}?tab=profile" style="color:${ACCENT};text-decoration:none;font-weight:700;">profile</a> — add a photo, bio, and your socials<br/>
              <span style="color:${ACCENT};font-weight:800;">2.</span> Customize your <a href="${dashboardUrl}?tab=link-in-bio" style="color:${ACCENT};text-decoration:none;font-weight:700;">Link in Bio</a> page<br/>
              <span style="color:${ACCENT};font-weight:800;">3.</span> Create a <a href="${dashboardUrl}?tab=release-page" style="color:${ACCENT};text-decoration:none;font-weight:700;">Release Page</a> for your next song
            </p>
          </td>
        </tr>
      </table>

      ${featureSection({
        eyebrow: "Link in Bio",
        title: "One link for everything you do",
        description: "Drop all your links, YouTube videos, and merch into a single customizable page — perfect for your Instagram or TikTok bio.",
        image: `${imageBase}/linkinbio.png`,
        ctaLabel: "Customize My Link in Bio",
        ctaHref: `${dashboardUrl}?tab=link-in-bio`,
      })}

      ${featureSection({
        eyebrow: "Release Pages",
        title: "Give your next song its own page",
        description: "Build a dedicated release page with your cover art, featured video, streaming links, and merch — ready to share the moment your song drops.",
        image: `${imageBase}/releasepages.png`,
        ctaLabel: "Create a Release Page",
        ctaHref: `${dashboardUrl}?tab=release-page`,
      })}

      <p style="font-size:13px;line-height:1.6;color:${TEXT};opacity:.6;margin:24px 0 0;text-align:center;">
        Questions? Just reply to this email — we're happy to help.
      </p>
      <p style="font-size:12px;color:${TEXT};opacity:.5;margin:12px 0 0;text-align:center;">
        Sent by <a href="https://influanto.com" style="color:${ACCENT};text-decoration:none;">Influanto</a>
      </p>
    </div>
  </div>`;
}
