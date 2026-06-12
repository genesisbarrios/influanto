"use client";
/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import { ID3Writer } from "browser-id3-writer";
import { readWavTags, writeWavTags } from "@/libs/wav-tags";

interface Tags {
  title: string; artist: string; album: string; composer: string;
  year: string; genre: string; copyright: string; url: string; comment: string;
}
const EMPTY: Tags = { title: "", artist: "", album: "", composer: "", year: "", genre: "", copyright: "", url: "", comment: "" };

async function readTags(file: File): Promise<{ tags: Partial<Tags>; cover?: string }> {
  try {
    // @ts-ignore - browser bundle has no types
    const mod: any = await import("jsmediatags/dist/jsmediatags.min.js");
    const jsmediatags = mod.default || mod;
    return await new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (res: any) => {
          const t = res?.tags || {};
          let cover: string | undefined;
          if (t.picture?.data?.length) {
            const { data, format } = t.picture;
            let bin = ""; const chunk = 0x8000;
            for (let i = 0; i < data.length; i += chunk) bin += String.fromCharCode.apply(null, data.slice(i, i + chunk));
            cover = `data:${format || "image/jpeg"};base64,${btoa(bin)}`;
          }
          resolve({
            tags: { title: t.title, artist: t.artist, album: t.album, composer: t.composer, year: t.year, genre: t.genre, copyright: t.copyright, comment: t.comment?.text || t.comment },
            cover,
          });
        },
        onError: () => resolve({ tags: {} }),
      });
    });
  } catch { return { tags: {} }; }
}

export default function MetadataEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [tags, setTags] = useState<Tags>(EMPTY);
  const [cover, setCover] = useState<string>("");           // data URL for preview
  const [coverBuffer, setCoverBuffer] = useState<ArrayBuffer | null>(null); // new cover bytes
  const [savedUrl, setSavedUrl] = useState<string>("");
  const [isWav, setIsWav] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Music Metadata Editor - Tag MP3 Files | Influanto";
    const meta = (n: string, a: string, v: string) => { let e = document.querySelector(`meta[${a}="${n}"]`); if (!e) { e = document.createElement("meta"); e.setAttribute(a, n); document.head.appendChild(e); } e.setAttribute("content", v); };
    const d = "Free music metadata editor. Upload an MP3 to edit title, artist, composer/producer, copyright, cover art and more, then download. By Influanto.";
    meta("description", "name", d); meta("og:title", "property", "Music Metadata Editor | Influanto"); meta("og:description", "property", d);
  }, []);

  useEffect(() => () => { if (savedUrl) URL.revokeObjectURL(savedUrl); }, [savedUrl]);

  const setTag = (k: keyof Tags, v: string) => setTags(prev => ({ ...prev, [k]: v }));

  const onFile = async (f?: File) => {
    if (!f) return;
    setError(""); setStatus(""); setSavedUrl(""); setCoverBuffer(null);
    setFile(f);
    const wav = /\.wav$/i.test(f.name) || /wav/i.test(f.type);
    setIsWav(wav);
    const buf = await f.arrayBuffer();
    setBuffer(buf);
    if (wav) {
      const t = readWavTags(buf);
      setTags({ ...EMPTY, ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v ?? ""])) } as Tags);
      setCover("");
    } else {
      const { tags: t, cover: c } = await readTags(f);
      setTags({ ...EMPTY, ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v ?? ""])) } as Tags);
      setCover(c || "");
    }
  };

  const onCover = async (f?: File) => {
    if (!f) return;
    setCoverBuffer(await f.arrayBuffer());
    const reader = new FileReader();
    reader.onload = () => setCover(String(reader.result || ""));
    reader.readAsDataURL(f);
  };

  const save = () => {
    if (!buffer) return;
    setError(""); setStatus("");
    try {
      if (isWav) {
        const blob = writeWavTags(buffer.slice(0), {
          title: tags.title, artist: tags.artist, album: tags.album, composer: tags.composer,
          year: tags.year, genre: tags.genre, copyright: tags.copyright, comment: tags.comment,
        });
        if (savedUrl) URL.revokeObjectURL(savedUrl);
        setSavedUrl(URL.createObjectURL(blob));
        setStatus("✅ Tags saved — preview and download below.");
        return;
      }
      const writer: any = new ID3Writer(buffer.slice(0));
      writer
        .setFrame("TIT2", tags.title || "")
        .setFrame("TPE1", tags.artist ? [tags.artist] : [])
        .setFrame("TALB", tags.album || "")
        .setFrame("TCOM", tags.composer ? [tags.composer] : [])
        .setFrame("TCON", tags.genre ? [tags.genre] : []);
      if (tags.year) writer.setFrame("TYER", tags.year);
      if (tags.copyright) writer.setFrame("TCOP", tags.copyright);
      if (tags.url) writer.setFrame("WOAR", tags.url);
      if (tags.comment) writer.setFrame("COMM", { description: "", text: tags.comment, language: "eng" });
      if (coverBuffer) writer.setFrame("APIC", { type: 3, data: coverBuffer, description: "Cover" });
      writer.addTag();
      const blob = writer.getBlob();
      if (savedUrl) URL.revokeObjectURL(savedUrl);
      setSavedUrl(URL.createObjectURL(blob));
      setStatus("✅ Tags saved — preview and download below.");
    } catch (e: any) {
      setError(e?.message?.includes("ID3") || e?.message?.includes("MP3") ? "Tag editing currently supports MP3 files. For WAV, convert to MP3 first." : (e?.message || "Could not save tags"));
    }
  };

  const downloadName = (file?.name || "song").replace(/\.\w+$/, "") + "_tagged" + (isWav ? ".wav" : ".mp3");

  return (
    <>
      <Suspense><Header /></Suspense>
      <div id="meta-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div style={{ background: "#f9fafb", textAlign: "center" }} className="w-full sm:w-3/4 p-8 sm:border-r sm:border-gray-300">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#181b20" }}>Music Metadata Editor</h1>
          <p className="mb-4" style={{ color: "#181b20" }}>Upload an MP3 or WAV, edit its tags &amp; cover art, then download.</p>

          {!file ? (
            <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-12 text-sm text-gray-500 hover:bg-gray-100" style={{ maxWidth: 640, margin: "0 auto" }}>
              Click to upload an MP3 or WAV
            </button>
          ) : (
            <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "left" }} className="space-y-4">
              <div className="flex gap-4 items-start flex-wrap">
                {/* Cover */}
                <div className="text-center">
                  <div style={{ width: 120, height: 120, borderRadius: 10, overflow: "hidden", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cover ? <img src={cover} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 36 }}>🎵</span>}
                  </div>
                  {isWav ? (
                    <p className="text-[11px] text-gray-400 mt-2" style={{ maxWidth: 120 }}>Cover art isn&apos;t supported in WAV</p>
                  ) : (
                    <>
                      <button className="btn btn-xs btn-outline mt-2" onClick={() => coverRef.current?.click()}>Change cover</button>
                      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => onCover(e.target.files?.[0])} />
                    </>
                  )}
                </div>
                {/* Fields */}
                <div className="flex-1 min-w-[220px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([["title","Title"],["artist","Artist"],["album","Album"],["composer","Composer / Producer"],["year","Year"],["genre","Genre"],["copyright","Copyright"],["url","URL"]] as [keyof Tags,string][]).map(([k,label]) => (
                    <div key={k}>
                      <label className="block text-xs font-medium mb-0.5" style={{ color: "#374151" }}>{label}</label>
                      <input className="input input-sm input-bordered w-full" value={tags[k]} onChange={e => setTag(k, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-0.5" style={{ color: "#374151" }}>Notes / Comments</label>
                <textarea className="textarea textarea-bordered w-full" rows={2} value={tags.comment} onChange={e => setTag("comment", e.target.value)} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {status && <p className="text-sm text-green-600">{status}</p>}

              <div className="flex gap-3 flex-wrap">
                <button className="btn btn-primary" style={{ background: "#2563eb", border: "none", color: "#fff" }} onClick={save}>Save tags</button>
                {savedUrl && <a className="btn" style={{ background: "#16a34a", color: "#fff", border: "none" }} href={savedUrl} download={downloadName}>⬇️ Download</a>}
                <button className="btn btn-outline" onClick={() => { setFile(null); setBuffer(null); setTags(EMPTY); setCover(""); setCoverBuffer(null); setSavedUrl(""); setStatus(""); setError(""); }}>Upload new file</button>
              </div>

              {savedUrl && <audio src={savedUrl} controls style={{ width: "100%", maxWidth: 640, marginTop: 8 }} />}
            </div>
          )}
          <input ref={fileRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }} className="w-full sm:w-1/4 p-8">
          <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
          <button className="btn btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: 8, marginBottom: "1.5rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }} onClick={() => (window.location.href = "api/auth/signin?callbackUrl=/dashboard")}>Sign Up</button>
          <div style={{ textAlign: "center" }}><p>Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.</p></div>
        </div>
      </div>
      <style>{`#meta-bg{background:#638bcf !important;} @media (min-width:640px){#meta-bg{flex-direction:row !important;}}`}</style>
      <Footer />
    </>
  );
}
