import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapQRCodes } from "@/libs/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const {
      link, name, color, dotStyle, cornerSquareStyle, cornerDotStyle,
      cornerSquareColor, cornerDotColor, transparentBg, bgColor, size,
    } = await req.json();

    if (!link) {
      return NextResponse.json({ error: "Link is required." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("qr_codes")
      .select("codes")
      .eq("user_id", userId)
      .maybeSingle();

    const currentCodes: any[] = existing?.codes ?? [];
    const newCode = {
      id: crypto.randomUUID(),
      url: link,
      name,
      color,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      cornerSquareColor,
      cornerDotColor,
      transparentBg,
      bgColor,
      size: size || 300,
    };

    const { data, error } = await supabase
      .from("qr_codes")
      .upsert(
        { user_id: userId, codes: [...currentCodes, newCode] },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: mapQRCodes(data) }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
