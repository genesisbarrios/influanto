"use client";
/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
// @ts-ignore
import piexif from "piexifjs";

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function ImagePrivacy() {
  const [src, setSrc] = useState<string>("");      // original data URL
  const [fileName, setFileName] = useState("");
  const [exif, setExif] = useState<any>(null);
  const [keepGps, setKeepGps] = useState(false);
  const [keepCamera, setKeepCamera] = useState(false);
  const [keepDate, setKeepDate] = useState(false);
  const [artist, setArtist] = useState("");
  const [copyright, setCopyright] = useState("");
  const [description, setDescription] = useState("");
  const [outUrl, setOutUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Image Privacy Cleaner - Remove EXIF / Location | Influanto";
    const meta = (n: string, a: string, v: string) => { let e = document.querySelector(`meta[${a}="${n}"]`); if (!e) { e = document.createElement("meta"); e.setAttribute(a, n); document.head.appendChild(e); } e.setAttribute("content", v); };
    const d = "Free image privacy tool. Remove GPS location, camera info and other EXIF metadata from your JPEGs, or edit it, then download. By Influanto.";
    meta("description", "name", d); meta("og:title", "property", "Image Privacy Cleaner | Influanto"); meta("og:description", "property", d);
  }, []);
  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const onFile = (f?: File) => {
    if (!f) return;
    setError(""); setStatus(""); setOutUrl("");
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setSrc(dataUrl);
      try {
        const ex = piexif.load(dataUrl);
        setExif(ex);
        setArtist(ex["0th"]?.[piexif.ImageIFD.Artist] || "");
        setCopyright(ex["0th"]?.[piexif.ImageIFD.Copyright] || "");
        setDescription(ex["0th"]?.[piexif.ImageIFD.ImageDescription] || "");
      } catch { setExif({}); }
    };
    reader.readAsDataURL(f);
  };

  const hasGps = exif && exif.GPS && Object.keys(exif.GPS).length > 0;
  const cameraMake = exif?.["0th"]?.[piexif?.ImageIFD?.Make];
  const cameraModel = exif?.["0th"]?.[piexif?.ImageIFD?.Model];
  const dateTaken = exif?.["Exif"]?.[piexif?.ExifIFD?.DateTimeOriginal] || exif?.["0th"]?.[piexif?.ImageIFD?.DateTime];

  const apply = () => {
    if (!src) return;
    setError(""); setStatus("");
    try {
      // Start from a fresh, empty EXIF and only add back what's kept.
      const out: any = { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, thumbnail: null };
      if (keepGps && exif?.GPS) out.GPS = exif.GPS;
      if (keepCamera) {
        for (const k of ["Make", "Model", "Software"]) {
          const id = (piexif.ImageIFD as any)[k];
          if (exif?.["0th"]?.[id] != null) out["0th"][id] = exif["0th"][id];
        }
      }
      if (keepDate) {
        if (exif?.["0th"]?.[piexif.ImageIFD.DateTime] != null) out["0th"][piexif.ImageIFD.DateTime] = exif["0th"][piexif.ImageIFD.DateTime];
        if (exif?.["Exif"]?.[piexif.ExifIFD.DateTimeOriginal] != null) out["Exif"][piexif.ExifIFD.DateTimeOriginal] = exif["Exif"][piexif.ExifIFD.DateTimeOriginal];
      }
      if (artist) out["0th"][piexif.ImageIFD.Artist] = artist;
      if (copyright) out["0th"][piexif.ImageIFD.Copyright] = copyright;
      if (description) out["0th"][piexif.ImageIFD.ImageDescription] = description;

      const stripped = piexif.remove(src); // remove all existing EXIF first
      const bytes = piexif.dump(out);
      const result = piexif.insert(bytes, stripped);
      if (outUrl) URL.revokeObjectURL(outUrl);
      setOutUrl(URL.createObjectURL(dataUrlToBlob(result)));
      setStatus("✅ Metadata updated — download below.");
    } catch (e: any) {
      setError(e?.message?.includes("JPEG") || String(e).includes("JPEG") ? "EXIF editing supports JPEG photos (.jpg/.jpeg)." : (e?.message || "Could not process image"));
    }
  };

  const stripAll = () => {
    if (!src) return;
    try {
      const result = piexif.remove(src);
      if (outUrl) URL.revokeObjectURL(outUrl);
      setOutUrl(URL.createObjectURL(dataUrlToBlob(result)));
      setStatus("✅ All metadata removed — download below.");
    } catch (e: any) { setError("EXIF editing supports JPEG photos."); }
  };

  const Toggle = ({ on, set, label, detail }: { on: boolean; set: (v: boolean) => void; label: string; detail?: string }) => (
    <div className="flex items-center gap-2 py-1">
      <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)}
        style={{ width: 44, height: 24, borderRadius: 999, background: on ? "#16a34a" : "#cbd5e1", position: "relative", border: "none", cursor: "pointer", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
      </button>
      <span className="text-sm" style={{ color: "#181b20" }}>{on ? "Keep" : "Remove"} {label}{detail ? <span className="text-gray-400"> · {detail}</span> : ""}</span>
    </div>
  );

  const outName = (fileName || "image.jpg").replace(/\.\w+$/, "") + "_clean.jpg";

  return (
    <>
      <Suspense><Header /></Suspense>
      <div id="img-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div style={{ background: "#f9fafb" }} className="w-full sm:w-3/4 p-8 sm:border-r sm:border-gray-300">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#181b20" }}>Image Privacy Cleaner</h1>
          <p className="mb-4" style={{ color: "#181b20" }}>Remove GPS location &amp; camera data from your photos (JPEG), or edit it, then download.</p>

          {!src ? (
            <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-12 text-sm text-gray-500 hover:bg-gray-100" style={{ maxWidth: 640 }}>
              Click to upload a JPEG photo
            </button>
          ) : (
            <div style={{ maxWidth: 640 }} className="space-y-4">
              <div className="flex gap-4 flex-wrap items-start">
                <img src={src} alt="" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }} />
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-semibold mb-1" style={{ color: "#181b20" }}>Detected metadata</p>
                  <Toggle on={keepGps} set={setKeepGps} label="location (GPS)" detail={hasGps ? "present ⚠️" : "none"} />
                  <Toggle on={keepCamera} set={setKeepCamera} label="camera info" detail={[cameraMake, cameraModel].filter(Boolean).join(" ") || "none"} />
                  <Toggle on={keepDate} set={setKeepDate} label="date taken" detail={dateTaken || "none"} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium mb-0.5" style={{ color: "#374151" }}>Artist</label><input className="input input-sm input-bordered w-full" value={artist} onChange={e => setArtist(e.target.value)} /></div>
                <div><label className="block text-xs font-medium mb-0.5" style={{ color: "#374151" }}>Copyright</label><input className="input input-sm input-bordered w-full" value={copyright} onChange={e => setCopyright(e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium mb-0.5" style={{ color: "#374151" }}>Description</label><input className="input input-sm input-bordered w-full" value={description} onChange={e => setDescription(e.target.value)} /></div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {status && <p className="text-sm text-green-600">{status}</p>}

              <div className="flex gap-3 flex-wrap">
                <button className="btn btn-primary" style={{ background: "#2563eb", border: "none", color: "#fff" }} onClick={apply}>Apply changes</button>
                <button className="btn btn-outline" onClick={stripAll}>🧹 Remove all metadata</button>
                {outUrl && <a className="btn" style={{ background: "#16a34a", color: "#fff", border: "none" }} href={outUrl} download={outName}>⬇️ Download</a>}
                <button className="btn btn-outline" onClick={() => { setSrc(""); setExif(null); setOutUrl(""); setStatus(""); setError(""); }}>Upload new</button>
              </div>
              {outUrl && <img src={outUrl} alt="cleaned" style={{ maxWidth: 240, borderRadius: 10, marginTop: 8, border: "1px solid #e5e7eb" }} />}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,.jpg,.jpeg" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }} className="w-full sm:w-1/4 p-8">
          <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
          <button className="btn btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: 8, marginBottom: "1.5rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }} onClick={() => (window.location.href = "api/auth/signin?callbackUrl=/dashboard")}>Sign Up</button>
          <div style={{ textAlign: "center" }}><p>Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.</p></div>
        </div>
      </div>
      <style>{`#img-bg{background:#638bcf !important;} @media (min-width:640px){#img-bg{flex-direction:row !important;}}`}</style>
      <Footer />
    </>
  );
}
