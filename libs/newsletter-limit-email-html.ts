// Sent once, the moment a free-plan artist's outreach_contacts list first
// reaches the 50-subscriber cap. Mirrors the dark, card-free style used in
// libs/welcome-email-html.ts.

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

export function renderNewsletterLimitEmailHtml(opts: { name?: string; limit: number }): string {
  const firstName = (opts.name || "").trim().split(" ")[0];
  const greeting = firstName ? `Hey ${escapeHtml(firstName)},` : "Hey there,";
  const pricingUrl = "https://influanto.com/#pricing";

  return `
  <div style="background:${BG};padding:40px 16px;margin:0;">
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

      <p style="text-align:center;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${TEXT};opacity:.6;margin:0 0 24px;">
        influanto
      </p>

      <h1 style="font-size:26px;font-weight:800;margin:0 0 16px;color:${TEXT};text-align:center;">
        Your newsletter list is full 🎉
      </h1>

      <p style="font-size:16px;line-height:1.6;margin:0 0 8px;color:${TEXT};">
        ${greeting}
      </p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:${TEXT};opacity:.9;">
        Congrats — your newsletter subscriber list just hit the free plan's ${opts.limit}-subscriber limit! That's great news for your fanbase, but it also means new signups from your Link in Bio and Release Pages are paused until you upgrade.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin:0 0 32px;background:#ffffff0d;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="font-size:15px;line-height:1.9;margin:0;color:${TEXT};">
              Upgrade to <strong>Influanto Pro</strong> to unlock:
            </p>
            <p style="font-size:15px;line-height:1.9;margin:8px 0 0;color:${TEXT};">
              <span style="color:${ACCENT};font-weight:800;">•</span> Unlimited newsletter subscribers<br/>
              <span style="color:${ACCENT};font-weight:800;">•</span> Unlimited outreach contacts &amp; newsletters<br/>
              <span style="color:${ACCENT};font-weight:800;">•</span> Advanced analytics and more Release Pages
            </p>
          </td>
        </tr>
      </table>

      ${button("Upgrade to Influanto Pro", pricingUrl)}

      <p style="font-size:13px;line-height:1.6;color:${TEXT};opacity:.7;margin:16px 0 0;text-align:center;">
        Start with a 14-day free trial — no charge today, cancel anytime.
      </p>

      <p style="font-size:13px;line-height:1.6;color:${TEXT};opacity:.6;margin:32px 0 0;text-align:center;">
        Questions? Just reply to this email — we're happy to help.
      </p>
      <p style="font-size:12px;color:${TEXT};opacity:.5;margin:12px 0 0;text-align:center;">
        Sent by <a href="https://influanto.com" style="color:${ACCENT};text-decoration:none;">Influanto</a>
      </p>
    </div>
  </div>`;
}
