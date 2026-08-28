import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapNewsletter, getNewsletterSenderInfo } from "@/libs/supabase";
import { renderNewsletterHtml } from "@/libs/newsletter-html";

async function authedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

const FREE_NEWSLETTER_LIMIT = 5;

export async function GET(_req: NextRequest) {
  const userId = await authedUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("newsletters")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data ?? []).map(mapNewsletter) });
}

export async function POST(req: NextRequest) {
  const userId = await authedUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRow } = await supabase.from("users").select("has_access").eq("id", userId).single();
  if (!userRow?.has_access) {
    const { count } = await supabase
      .from("newsletters")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) >= FREE_NEWSLETTER_LIMIT) {
      return NextResponse.json(
        { error: `Free plan is limited to ${FREE_NEWSLETTER_LIMIT} newsletters. Upgrade to create more.` },
        { status: 403 }
      );
    }
  }

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
    .insert({
      user_id: userId,
      subject: body.subject ?? "",
      status: "draft",
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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: mapNewsletter(data) }, { status: 201 });
}
