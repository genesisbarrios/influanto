import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { DOCUMENT_BUCKET, MAX_DOCUMENT_BYTES, ensureBucket } from "@/libs/documents";

export const dynamic = "force-dynamic";

// POST { size }: a signed URL the browser uploads the PDF to directly (skips
// the serverless body limit). The document row is created afterwards by
// POST /api/documents, which checks the file.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { size } = await req.json().catch(() => ({}));
  if (Number(size) > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "PDFs can be up to 20 MB" }, { status: 400 });
  }

  await ensureBucket();
  const path = `${session.user.id}/${crypto.randomUUID()}.pdf`;
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not start the upload" }, { status: 500 });
  const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/${DOCUMENT_BUCKET}/${path}?token=${data.token}`;
  return NextResponse.json({ uploadUrl, path });
}
