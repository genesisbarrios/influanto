import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapReleasePage } from "@/libs/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  try {
    const { id, bgColor, textColor, linksColor, links, name, description, video, image, selectedProducts, font, newsletterEnabled, newsletterFields } = body;

    if (id) {
      const updates: Record<string, any> = { user_id: userId };
      if (bgColor !== undefined) updates.bg_color = bgColor;
      if (textColor !== undefined) updates.text_color = textColor;
      if (linksColor !== undefined) updates.links_color = linksColor;
      if (name) updates.name = name;
      if (image) updates.image = image;
      if (description !== undefined) updates.description = description;
      if (font) updates.font = font;
      if (video !== undefined) updates.video = video;
      if (Array.isArray(links)) updates.links = links;
      if (selectedProducts !== undefined) updates.selected_products = selectedProducts ?? [];
      if (newsletterEnabled !== undefined) updates.newsletter_enabled = newsletterEnabled;
      if (newsletterFields !== undefined) updates.newsletter_fields = newsletterFields ?? ["name", "email"];

      const { data, error } = await supabase
        .from("release_pages")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data: mapReleasePage(data) }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("release_pages")
      .insert({
        user_id: userId,
        bg_color: bgColor,
        text_color: textColor,
        links_color: linksColor,
        font,
        links: links ?? [],
        video,
        image,
        description,
        name,
        selected_products: selectedProducts ?? [],
        newsletter_enabled: newsletterEnabled ?? false,
        newsletter_fields: newsletterFields ?? ["name", "email"],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data: mapReleasePage(data) }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating or creating ReleasePage:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
