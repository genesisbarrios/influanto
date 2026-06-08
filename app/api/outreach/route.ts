import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapNewsletter } from "@/libs/supabase";
import { renderNewsletterHtml } from "@/libs/newsletter-html";

// Returns the session user id if they exist and have premium access, else null.
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

export async function GET(_req: NextRequest) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { data, error } = await supabase
    .from("newsletters")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data ?? []).map(mapNewsletter) });
}

export async function POST(req: NextRequest) {
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
  };

  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      user_id: userId,
      subject: body.subject ?? "",
      status: "draft",
      html: renderNewsletterHtml(content),
      title: content.title,
      template: content.template,
      image: content.image,
      description: content.description,
      links: content.links,
      bg_color: content.bgColor,
      text_color: content.textColor,
      links_color: content.linksColor,
      url_redirect: content.urlRedirect,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: mapNewsletter(data) }, { status: 201 });
}
