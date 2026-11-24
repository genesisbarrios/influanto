import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { DOCUMENT_BUCKET, safeFilename, signedFileUrl } from "@/libs/documents";

export const dynamic = "force-dynamic";

async function own(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const { data } = await supabase.from("documents").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle();
  return data;
}

// GET ?file=original|signed&download=1: a short-lived link to the file
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const doc = await own(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const which = req.nextUrl.searchParams.get("file") === "signed" ? "signed" : "original";
  const path = which === "signed" ? doc.signed_path : doc.file_path;
  if (!path) return NextResponse.json({ error: "Not signed by everyone yet" }, { status: 404 });
  const download = req.nextUrl.searchParams.get("download") ? safeFilename(doc.title, which === "signed" ? "-signed" : "") : undefined;
  const url = await signedFileUrl(path, 60 * 10, download);
  if (!url) return NextResponse.json({ error: "Could not open the file" }, { status: 500 });
  return NextResponse.json({ url, filename: safeFilename(doc.title, which === "signed" ? "-signed" : "") });
}

// PATCH { title?, message? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const doc = await own(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") patch.title = body.title.trim().slice(0, 200) || doc.title;
  if (typeof body.message === "string") patch.message = body.message.slice(0, 2000);
  const { error } = await supabase.from("documents").update(patch).eq("id", doc.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: the document, its signers and its files
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = await own(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await supabase.storage.from(DOCUMENT_BUCKET).remove([doc.file_path, doc.signed_path].filter(Boolean)).catch(() => {});
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
