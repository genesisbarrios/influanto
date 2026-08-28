import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapNewsletter, getNewsletterSenderInfo } from "@/libs/supabase";
import { renderNewsletterHtml } from "@/libs/newsletter-html";

async function premiumUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const { data } = await supabase
    .from("users")
    .select("has_access")
    .eq("id", session.user.id)
    .single();
  return data?.has_access ? session.user.id : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { data, error } = await supabase
    .from("newsletters")
    .select()
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: mapNewsletter(data) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const body = await req.json();
  const content = {
    title: body.title ?? "",
    template: body.template ?? "blank",
    image: body.image ?? "",
    description: body.description ?? "",
    links: Array.isArray(body.links) ? body.links : [],
    bgColor: body.bgColor ?? "",
    textColor: body.textColor ?? "",
    linksColor: body.linksColor ?? "",
    urlRedirect: body.urlRedirect ?? "",
    newsletterEnabled: Boolean(body.newsletterEnabled),
  };

  const { senderName, socials, artistImage, username } = await getNewsletterSenderInfo(userId);

  const { data, error } = await supabase
    .from("newsletters")
    .update({
      subject: body.subject ?? "",
      html: renderNewsletterHtml(content, { senderName, socials, artistImage, username }),
      title: content.title,
      template: content.template,
      image: content.image,
      description: content.description,
      links: content.links,
      bg_color: content.bgColor,
      text_color: content.textColor,
      links_color: content.linksColor,
      url_redirect: content.urlRedirect,
      newsletter_enabled: content.newsletterEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: mapNewsletter(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { error } = await supabase
    .from("newsletters")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
