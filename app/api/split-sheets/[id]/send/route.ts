import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

// Build emailed links from the canonical domain — NEXTAUTH_URL can be localhost
// in some environments, which would break the sign/login links in the email.
const APP_URL = `https://${config.domainName}`;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactIds } = await req.json();
  if (!contactIds?.length) {
    return NextResponse.json({ error: "No contacts selected" }, { status: 400 });
  }

  // Fetch split sheet (ownership check)
  const { data: sheet, error: sheetErr } = await supabase
    .from("split_sheets")
    .select()
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (sheetErr || !sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch selected contacts
  const { data: contacts } = await supabase
    .from("collaborator_contacts")
    .select()
    .eq("user_id", session.user.id)
    .in("id", contactIds);

  if (!contacts?.length) return NextResponse.json({ error: "Contacts not found" }, { status: 404 });

  // Fetch sender info
  const { data: sender } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", session.user.id)
    .single();

  const senderName = sender?.name || "A collaborator";

  // Build HTML table fragments
  const contributorsRows = (sheet.contributors as any[])
    .map((c: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.name || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.role || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.ownership || "—"}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.contact || "—"}</td>
      </tr>`)
    .join("");

  const publishingRows = (sheet.publishing as any[])
    .map((p: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${p.contributorName || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${p.publisher || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${p.percent || "—"}%</td>
      </tr>`)
    .join("");

  const errors: string[] = [];

  for (const contact of contacts) {
    try {
    // Get or create a unique signing token for this contact + sheet
    let token: string;
    const { data: existingSigner } = await supabase
      .from("split_sheet_signers")
      .select("token")
      .eq("split_sheet_id", sheet.id)
      .eq("contributor_email", contact.email.toLowerCase())
      .maybeSingle();

    if (existingSigner?.token) {
      token = existingSigner.token;
    } else {
      const { data: newSigner, error: signerErr } = await supabase
        .from("split_sheet_signers")
        .insert({
          split_sheet_id: sheet.id,
          contributor_name: contact.name,
          contributor_email: contact.email.toLowerCase(),
        })
        .select("token")
        .single();

      if (signerErr || !newSigner) {
        errors.push(`${contact.email}: Could not create signing token — ${signerErr?.message ?? "unknown error"}`);
        continue;
      }
      token = newSigner.token;
    }

    const signUrl = `${APP_URL}/sign/${token}`;
    // Login also returns to the signing page — once authenticated, signing saves
    // a copy of the sheet under the signer's account.
    const loginUrl = `${APP_URL}/api/auth/signin?callbackUrl=${encodeURIComponent(`/sign/${token}`)}`;

    const html = `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111;">
        <p style="font-size:12px;color:#6b7280;margin-bottom:24px;">Powered by <a href="https://influanto.com" style="color:#4f46e5;">Influanto</a></p>

        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px;">Split Sheet Agreement</h1>
        <p style="color:#6b7280;margin-bottom:8px;"><strong>${senderName}</strong> has sent you a split sheet to review and sign.</p>
        <p style="color:#6b7280;margin-bottom:28px;">Hi ${contact.name}, please review the details below and click the button to add your signature.</p>

        <!-- CTA Buttons -->
        <div style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap;">
          <a href="${signUrl}"
            style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
            ✍️ Sign Split Sheet
          </a>
          <a href="${loginUrl}"
            style="display:inline-block;padding:12px 28px;background:#fff;color:#4f46e5;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;border:2px solid #4f46e5;">
            🔐 Login to Influanto
          </a>
        </div>

        <!-- Sheet details -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:6px 0;font-weight:600;width:140px;">Song Title</td><td>${sheet.title}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;">Date</td><td>${sheet.date}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;">Artist(s)</td><td>${sheet.artists}</td></tr>
          ${sheet.state_country ? `<tr><td style="padding:6px 0;font-weight:600;">Jurisdiction</td><td>${sheet.state_country}</td></tr>` : ""}
        </table>

        <h2 style="font-size:16px;font-weight:700;margin-bottom:8px;">Primary Contributors</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Name</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Role</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Ownership</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Contact</th>
            </tr>
          </thead>
          <tbody>${contributorsRows}</tbody>
        </table>

        ${publishingRows ? `
          <h2 style="font-size:16px;font-weight:700;margin-bottom:8px;">Publishing Details</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Contributor</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Publisher</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">%</th>
              </tr>
            </thead>
            <tbody>${publishingRows}</tbody>
          </table>` : ""}

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:28px;font-size:13px;color:#374151;">
          <strong>Agreement Terms:</strong> Each contributor agrees to the ownership percentages of the composition and master recording. All royalties will be distributed accordingly. Dispute resolution under the laws of ${sheet.state_country || "applicable jurisdiction"}. By signing, all parties acknowledge their contributions are accurately reflected.
        </div>

        <!-- Repeat sign CTA at bottom -->
        <div style="text-align:center;padding:20px;background:#f0f0ff;border-radius:12px;">
          <p style="font-size:15px;font-weight:600;margin-bottom:12px;">Ready to sign?</p>
          <a href="${signUrl}"
            style="display:inline-block;padding:14px 36px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
            ✍️ Sign Now
          </a>
          <p style="font-size:12px;color:#9ca3af;margin-top:12px;">
            No account required · <a href="${loginUrl}" style="color:#4f46e5;">Login to Influanto</a> to save this to your account
          </p>
        </div>

        <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center;">
          This email was sent by ${senderName} via <a href="https://influanto.com" style="color:#4f46e5;">Influanto</a>.
          Your unique signing link: <a href="${signUrl}" style="color:#4f46e5;">view split sheet</a>
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: contact.email,
        subject: `✍️ Please sign: "${sheet.title}" — from ${senderName}`,
        text: `${senderName} shared a split sheet for "${sheet.title}". Sign here: ${signUrl}`,
        html,
        replyTo: sender?.email || "noreply@influanto.com",
      });
    } catch (e: any) {
      errors.push(`${contact.email}: ${e.message}`);
    }
    } catch (e: any) {
      // Catch-all for token creation or any unexpected error for this contact
      errors.push(`${contact.email}: ${e.message}`);
    }
  }

  // Mark sheet as sent
  await supabase
    .from("split_sheets")
    .update({ status: "sent" })
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (errors.length) {
    return NextResponse.json({ message: "Sent with some errors", errors }, { status: 207 });
  }

  return NextResponse.json({ message: `Sent to ${contacts.length} contact(s)` });
}
