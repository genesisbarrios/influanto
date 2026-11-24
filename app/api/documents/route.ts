import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { PDFDocument } from "pdf-lib";
import supabase from "@/libs/supabase";
import { DOCUMENT_BUCKET, FREE_DOCUMENT_LIMIT, MAX_DOCUMENT_BYTES, downloadFile, sha256 } from "@/libs/documents";

export const dynamic = "force-dynamic";

const SIGNER_FIELDS = "id, name, email, signed_at, viewed_at, last_sent_at";

// GET: your documents (newest first), with their signers
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("documents")
    .select(`id, title, message, status, page_count, file_size, last_sent_at, completed_at, created_at, document_signers(${SIGNER_FIELDS})`)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST { title, path, message? }: a document from a PDF just uploaded to `path`
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const path = String(body.path || "");
  // only files uploaded under this account's own folder
  if (!path.startsWith(`${userId}/`) || path.includes("..")) {
    return NextResponse.json({ error: "Upload not found" }, { status: 400 });
  }

  const [{ count }, { data: account }] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("users").select("has_access").eq("id", userId).single(),
  ]);
  const removeUpload = () => supabase.storage.from(DOCUMENT_BUCKET).remove([path]).catch(() => {});
  if (!account?.has_access && (count ?? 0) >= FREE_DOCUMENT_LIMIT) {
    await removeUpload();
    return NextResponse.json({ error: `Free accounts can have ${FREE_DOCUMENT_LIMIT} documents. Delete one or upgrade to Pro for unlimited.`, upgrade: true, reason: "documents" }, { status: 403 });
  }

  // check it really is a PDF we can read
  let bytes: Uint8Array;
  let pages = 0;
  try {
    bytes = await downloadFile(path);
    if (bytes.length > MAX_DOCUMENT_BYTES) throw new Error("PDFs can be up to 20 MB");
    if (Buffer.from(bytes.subarray(0, 5)).toString() !== "%PDF-") throw new Error("That file isn't a PDF");
    pages = (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
  } catch (e: any) {
    await removeUpload();
    return NextResponse.json({ error: e?.message?.startsWith("PDFs") || e?.message?.startsWith("That") ? e.message : "That PDF couldn't be read. Try exporting it again." }, { status: 400 });
  }

  const title = String(body.title || "").trim().slice(0, 200) || "Untitled document";
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      title,
      message: String(body.message || "").slice(0, 2000),
      file_path: path,
      file_hash: sha256(bytes),
      file_size: bytes.length,
      page_count: pages,
    })
    .select(`id, title, message, status, page_count, file_size, last_sent_at, completed_at, created_at, document_signers(${SIGNER_FIELDS})`)
    .single();
  if (error) {
    await removeUpload();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
