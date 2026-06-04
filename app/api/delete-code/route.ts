import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  const { id } = await req.json();
  const userId = session.user.id;

  try {
    const { data: existing } = await supabase
      .from("qr_codes")
      .select("codes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const codes = existing.codes as any[];
    // Support both new UUID `id` field and legacy MongoDB `_id` strings
    const updatedCodes = codes.filter(
      (c) => c.id !== id && c._id?.toString() !== id
    );

    if (updatedCodes.length === codes.length) {
      return NextResponse.json(
        { error: "QR Code not found or you don't have permission to delete it." },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("qr_codes")
      .update({ codes: updatedCodes })
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ message: "QR Code deleted successfully." }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
