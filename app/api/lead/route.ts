import { NextResponse, NextRequest } from "next/server";
import supabase from "@/libs/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("leads")
      .insert({ email: body.email });

    // 23505 = unique_violation — duplicate email is fine, just return 200
    if (error && error.code !== "23505") throw error;

    return NextResponse.json({});
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
