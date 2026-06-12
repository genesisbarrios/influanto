import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

const BUCKET = "crossposts";

async function premiumUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const { data } = await supabase.from("users").select("has_access").eq("id", session.user.id).single();
  return data?.has_access ? session.user.id : null;
}

// Returns a signed URL the browser uploads directly to (bypasses serverless body
// limits, no anon key needed — the token authorizes the single upload).
export async function POST(req: NextRequest) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { fileName, contentType } = await req.json();
  if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });

  // Ensure the (public) bucket exists — idempotent.
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const safe = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${userId}/${crypto.randomUUID()}-${safe}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not create upload URL" }, { status: 500 });

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  // Explicit storage upload endpoint (token in query authorizes this single PUT).
  const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}?token=${data.token}`;

  return NextResponse.json({ uploadUrl, token: data.token, path, publicUrl, contentType: contentType || "application/octet-stream" });
}
