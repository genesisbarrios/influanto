"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolSeo from "@/components/ToolSeo";
import ToolJoinSidebar, { useShowJoinSidebar, toolPaneClass } from "@/components/ToolJoinSidebar";
import { openUpgrade } from "@/components/UpgradeModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faLock, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

// YouTube video and audio downloader. The downloading happens on a separate
// server (libs/ytDownloader.ts); free users get up to 720p, Pro full quality.

type Quality = { height: number; label: string; approxBytes: number | null };
type Info = { url: string; title: string; channel: string; duration: number; thumbnail: string; isLive: boolean; qualities: Quality[] };
type JobState = { status: "queued" | "running" | "done" | "error"; stage: string; percent: number; speed: number | null; eta: number | null; error: string | null; filename: string | null };

const fmtSize = (b: number | null) => (!b ? "" : b > 1e9 ? `~${(b / 1e9).toFixed(1)} GB` : `~${Math.max(1, Math.round(b / 1e6))} MB`);
const fmtDur = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};
const ACCENT = "#dc2626";

export default function YouTubeDownloader() {
  const showSidebar = useShowJoinSidebar();
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [cap, setCap] = useState<number | null>(720);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [height, setHeight] = useState<number>(720);
  const [container, setContainer] = useState<"mp4" | "mov">("mp4");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav" | "m4a">("mp3");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [job, setJob] = useState<JobState | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const source = useRef<EventSource | null>(null);

  useEffect(() => () => source.current?.close(), []);

  const lookUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(""); setInfo(null); setJob(null); setFileUrl("");
    if (!url.trim()) return setError("Paste a YouTube link.");
    setLoading(true);
    try {
      const r = await fetch("/api/youtube-downloader/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't read that video.");
      setInfo(d.info);
      setCap(d.maxHeight);
      const allowed = (d.info.qualities as Quality[]).filter((q) => !d.maxHeight || q.height <= d.maxHeight);
      setHeight(allowed[0]?.height || d.info.qualities.at(-1)?.height || 360);
    } catch (err: any) {
      setError(err?.message || "Couldn't read that video.");
    } finally {
      setLoading(false);
    }
  };

  const pickQuality = (q: Quality) => {
    if (cap && q.height > cap) return openUpgrade("youtube_downloader", `Downloads above ${cap}p are part of Influanto Pro.`);
    setHeight(q.height);
  };

  const download = async () => {
    if (!info) return;
    setError(""); setFileUrl("");
    source.current?.close();
    setJob({ status: "queued", stage: "Starting…", percent: 0, speed: null, eta: null, error: null, filename: null });
    try {
      const opts = mode === "video"
        ? { mode, height, container, encoding: container === "mov" ? "h264" : "original", start: start || undefined, end: end || undefined }
        : { mode, audioFormat, audioBitrate: "320", start: start || undefined, end: end || undefined };
      const r = await fetch("/api/youtube-downloader/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: info.url, opts }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't start the download.");
      const es = new EventSource(d.events);
      source.current = es;
      es.onmessage = (m) => {
        const s: JobState = JSON.parse(m.data);
        setJob(s);
        if (s.status === "done") { es.close(); setFileUrl(d.file); window.location.href = d.file; }
        if (s.status === "error") es.close();
      };
      es.onerror = () => {
        es.close();
        setJob((j) => (j && j.status !== "done" ? { ...j, status: "error", error: "Lost the connection to the download. Try again." } : j));
      };
    } catch (err: any) {
      setJob(null);
      setError(err?.message || "Couldn't start the download.");
    }
  };

  const busy = job && (job.status === "queued" || job.status === "running");

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div id="yt-dl-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div className={toolPaneClass(showSidebar, "p-4 sm:p-8")} style={{ background: "#f9fafb", color: "#181b20" }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">YouTube Downloader</h1>
            <p className="text-center text-gray-600 mb-6">
              Download YouTube videos as MP4 or MOV, or just the audio as MP3, WAV or M4A. Free up to 720p;{" "}
              <button className="underline font-medium" onClick={() => openUpgrade("youtube_downloader", "Download in full quality, up to 4K, with Influanto Pro.")}>Pro</button>{" "}
              gets full quality up to 4K.
            </p>

            <form onSubmit={lookUp} className="flex gap-2">
              <input
                className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                placeholder="https://www.youtube.com/watch?v=…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
              />
              <button className="shrink-0 rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: ACCENT }} disabled={loading}>
                <FontAwesomeIcon icon={faMagnifyingGlass} /> {loading ? "Loading…" : "Get video"}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {info && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={info.thumbnail} alt="" className="w-36 sm:w-48 aspect-video object-cover rounded-lg bg-gray-100 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug line-clamp-2">{info.title}</p>
                    <p className="text-sm text-gray-500">{info.channel}{info.duration ? ` · ${fmtDur(info.duration)}` : ""}</p>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-lg border border-gray-300 p-0.5 text-sm">
                  {(["video", "audio"] as const).map((m) => (
                    <button key={m} className={`px-4 py-1.5 rounded-md ${mode === m ? "text-white" : ""}`} style={mode === m ? { background: ACCENT } : undefined} onClick={() => setMode(m)}>
                      {m === "video" ? "Video" : "Audio only"}
                    </button>
                  ))}
                </div>

                {mode === "video" ? (
                  <>
                    <p className="mt-4 text-sm font-medium">Quality</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {info.qualities.map((q) => {
                        const locked = !!cap && q.height > cap;
                        return (
                          <button
                            key={q.height}
                            onClick={() => pickQuality(q)}
                            className={`rounded-lg border px-3 py-1.5 text-sm ${height === q.height ? "text-white border-transparent" : "border-gray-300 bg-white"} ${locked ? "text-gray-400" : ""}`}
                            style={height === q.height ? { background: ACCENT } : undefined}
                          >
                            {locked && <FontAwesomeIcon icon={faLock} className="mr-1 text-xs" />}
                            {q.label}
                            {q.approxBytes && !locked ? <span className="ml-1 text-xs opacity-70">{fmtSize(q.approxBytes)}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm font-medium">Format</p>
                    <div className="mt-1 flex gap-2 text-sm">
                      {(["mp4", "mov"] as const).map((c) => (
                        <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="container" checked={container === c} onChange={() => setContainer(c)} /> {c.toUpperCase()}
                          {c === "mov" && <span className="text-xs text-gray-500">(Final Cut, iMovie)</span>}
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-sm font-medium">Format</p>
                    <div className="mt-1 flex gap-4 text-sm">
                      {(["mp3", "wav", "m4a"] as const).map((f) => (
                        <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="audio" checked={audioFormat === f} onChange={() => setAudioFormat(f)} /> {f.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </>
                )}

                <p className="mt-4 text-sm font-medium">Only part of it? <span className="font-normal text-gray-500">(optional)</span></p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <input className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1" placeholder="Start 0:00" value={start} onChange={(e) => setStart(e.target.value)} />
                  <span>to</span>
                  <input className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1" placeholder={info.duration ? `End ${fmtDur(info.duration)}` : "End"} value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>

                <button
                  className="mt-5 w-full rounded-lg py-3 font-semibold text-white disabled:opacity-60"
                  style={{ background: ACCENT }}
                  disabled={!!busy}
                  onClick={download}
                >
                  <FontAwesomeIcon icon={faDownload} /> {busy ? "Downloading…" : `Download ${mode === "video" ? `${height}p ${container.toUpperCase()}` : audioFormat.toUpperCase()}`}
                </button>

                {job && (
                  <div className="mt-4">
                    {job.status === "error" ? (
                      <p className="text-sm text-red-600"><FontAwesomeIcon icon={faXmark} /> {job.error || "The download failed."}</p>
                    ) : (
                      <>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${Math.round(job.percent || 0)}%`, background: ACCENT }} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {job.status === "done" ? "Done." : job.stage}
                          {job.status === "running" && job.eta ? ` · about ${Math.max(1, Math.round(job.eta))}s left` : ""}
                        </p>
                      </>
                    )}
                    {fileUrl && (
                      <a href={fileUrl} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}>
                        <FontAwesomeIcon icon={faDownload} /> Download didn&apos;t start? Click here
                      </a>
                    )}
                    {fileUrl && <p className="mt-1 text-xs text-gray-400">The file is deleted from our server after an hour.</p>}
                  </div>
                )}
              </div>
            )}

            <p className="mt-6 text-xs text-gray-500">
              Only download videos you own or have permission to use, like your own uploads, your music, or Creative Commons content.
            </p>
          </div>
        </div>
        <ToolJoinSidebar show={showSidebar} />
      </div>
      <style>{`
        #yt-dl-bg { background: #ef4444 !important; }
        @media (min-width: 640px) { #yt-dl-bg { flex-direction: row !important; } }
      `}</style>
      <ToolSeo slug="YouTube-Downloader" />
      <Footer />
    </>
  );
}
