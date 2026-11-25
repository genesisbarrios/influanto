"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolSeo from "@/components/ToolSeo";
import ToolJoinSidebar, { useShowJoinSidebar, toolPaneClass } from "@/components/ToolJoinSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket, faDownload } from "@fortawesome/free-solid-svg-icons";
import { mp4ToMov, NotMp4Error, type Mp4Info } from "@/libs/mp4ToMov";

// Free MP4 to MOV converter: rewraps the video as QuickTime without
// re-encoding (libs/mp4ToMov.ts), in the browser, so nothing is uploaded.

type Job = { id: number; file: File; status: "working" | "done" | "error"; url?: string; info?: Mp4Info; error?: string };

const fmtSize = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
const movName = (name: string) => name.replace(/\.[^.]+$/, "") + ".mov";

export default function Mp4ToMov() {
  const showSidebar = useShowJoinSidebar();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const urls = useRef<string[]>([]);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = (files: FileList | null | undefined) => {
    if (!files?.length) return;
    Array.from(files).forEach(async (file) => {
      const id = nextId.current++;
      setJobs((js) => [{ id, file, status: "working" }, ...js]);
      try {
        const { blob, info } = await mp4ToMov(file);
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        setJobs((js) => js.map((j) => (j.id === id ? { ...j, status: "done", url, info } : j)));
      } catch (err) {
        const error = err instanceof NotMp4Error ? err.message : "This file couldn't be converted.";
        setJobs((js) => js.map((j) => (j.id === id ? { ...j, status: "error", error } : j)));
      }
    });
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div id="mp4-mov-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div className={toolPaneClass(showSidebar, "p-4 sm:p-8")} style={{ background: "#f9fafb", color: "#181b20" }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">Free MP4 to MOV Converter</h1>
            <p className="text-center text-gray-600 mb-6">
              Turn MP4 videos into QuickTime MOV files for Final Cut Pro, iMovie and QuickTime. No re-encoding, so there&apos;s zero
              quality loss and even huge files convert in seconds. Everything happens in your browser.
            </p>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400"}`}
            >
              <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-2xl text-blue-600 mb-2" />
              <p className="font-semibold">Drop MP4 videos here, or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">MP4 and M4V · several at once is fine</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="video/mp4,.mp4,.m4v,video/*"
                className="hidden"
                onChange={(e) => { add(e.target.files); e.target.value = ""; }}
              />
            </div>

            {jobs.length > 0 && (
              <ul className="mt-6 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {jobs.map((j) => (
                  <li key={j.id} className="flex items-center gap-3 p-3 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{j.file.name}</p>
                      {j.status === "working" && <p className="text-xs text-gray-500">Converting…</p>}
                      {j.status === "error" && <p className="text-xs text-red-600">{j.error}</p>}
                      {j.status === "done" && j.info && (
                        <>
                          <p className="text-xs text-gray-500">
                            MOV · {fmtSize(j.file.size)}{j.info.codecs.length ? ` · ${j.info.codecs.join(", ")}` : ""}
                          </p>
                          {j.info.unsupported.length > 0 && (
                            <p className="text-xs text-amber-700 mt-1">
                              QuickTime and Final Cut can&apos;t play {j.info.unsupported.join(" or ")} inside a MOV. Re-export this video as
                              H.264 or HEVC if it won&apos;t open.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {j.status === "done" && j.url && (
                      <a
                        href={j.url}
                        download={movName(j.file.name)}
                        className="shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
                        style={{ background: "#2563eb" }}
                      >
                        <FontAwesomeIcon icon={faDownload} /> Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 text-sm text-gray-600 space-y-2 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-800">How does it convert without losing quality?</h2>
              <p>
                MP4 and MOV are both containers: boxes that hold the same video and audio streams. This tool moves your streams into a
                QuickTime container as they are, instead of decoding and re-compressing them, so the picture and sound are bit-for-bit
                identical to the original. H.264, HEVC and AAC, which phones, cameras and most editors export, all play in QuickTime and
                Final Cut Pro.
              </p>
            </div>
          </div>
        </div>
        <ToolJoinSidebar show={showSidebar} />
      </div>
      <style>{`
        #mp4-mov-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #mp4-mov-bg { flex-direction: row !important; } }
      `}</style>
      <ToolSeo slug="MP4-to-MOV" />
      <Footer />
    </>
  );
}
