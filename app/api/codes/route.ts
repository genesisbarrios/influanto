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
    // Ensure the destination has a scheme so the QR / redirect always works.
    const normalizedLink = /^https?:\/\//i.test(String(link).trim()) ? String(link).trim() : "https://" + String(link).trim();
    const newCode = {
      id: crypto.randomUUID(),
      url: normalizedLink,
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

// Update an existing code's destination (and name) — keeps the same QR image, so
// premium /code/<id> QR codes are truly dynamic/editable after printing/sharing.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  const userId = session.user.id;

  try {
    const { id, url, name } = await req.json();
    if (!id) return NextResponse.json({ error: "Code id is required." }, { status: 400 });

    const { data: existing } = await supabase
      .from("qr_codes")
      .select("codes")
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const codes: any[] = existing.codes ?? [];
    let found = false;
    const updated = codes.map((c) => {
      if (c.id === id || c._id?.toString?.() === id) {
        found = true;
        const next = { ...c };
        if (url !== undefined && String(url).trim()) {
          const u = String(url).trim();
          next.url = /^https?:\/\//i.test(u) ? u : "https://" + u;
        }
        if (name !== undefined) next.name = name;
        return next;
      }
      return c;
    });
    if (!found) return NextResponse.json({ error: "QR code not found." }, { status: 404 });

    const { data, error } = await supabase
      .from("qr_codes")
      .update({ codes: updated })
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data: mapQRCodes(data) }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
