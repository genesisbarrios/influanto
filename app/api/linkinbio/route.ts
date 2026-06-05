import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapLinkInBio } from "@/libs/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  try {
    const { data, error } = await supabase
      .from("link_in_bio")
      .upsert(
        {
          user_id: userId,
          bg_color: body.bgColor,
          text_color: body.textColor,
          links_color: body.linksColor,
          card_bg_color: body.cardBgColor,
          font: body.font,
          bg_image: body.bgImage,
          bg_mode: body.bgMode,
          bg_image_custom: body.bgImageCustom,
          pattern_id: body.patternId,
          pattern_fg: body.patternFg,
          pattern_bg: body.patternBg,
          pattern_opacity: body.patternOpacity,
          links: body.links ?? [],
          selected_products: body.selectedProducts ?? [],
          brand_logo_url: body.brandLogoUrl ?? null,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: mapLinkInBio(data) }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating LinkInBio:", error);
    return NextResponse.json({ error: "Something went wrong", details: error.message }, { status: 500 });
  }
}
