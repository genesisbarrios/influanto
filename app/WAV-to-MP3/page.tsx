"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolSeo from "@/components/ToolSeo";
import ToolJoinSidebar, { useShowJoinSidebar, toolPaneClass } from "@/components/ToolJoinSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket, faDownload } from "@fortawesome/free-solid-svg-icons";

// Free WAV to MP3 converter: the browser decodes the file and a Web Worker
// encodes it with LAME (public/vendor/lame.min.js), so nothing is uploaded.

const BITRATES = [128, 192, 256, 320];
// Sample rates MP3 supports; anything else is resampled to the nearest family
const MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];

type Job = {
  id: number;
  file: File;
  status: "waiting" | "decoding" | "encoding" | "done" | "error";
  progress: number;
  url?: string;
  size?: number;
  error?: string;
};

function wavSampleRate(buf: ArrayBuffer): number | null {
  const v = new DataView(buf);
  if (v.byteLength < 12 || v.getUint32(0, false) !== 0x52494646 || v.getUint32(8, false) !== 0x57415645) return null; // RIFF / WAVE
  let p = 12;
  while (p + 8 <= v.byteLength) {
    const id = v.getUint32(p, false);
    const size = v.getUint32(p + 4, true);
    if (id === 0x666d7420 && p + 16 <= v.byteLength) return v.getUint32(p + 12, true); // "fmt "
    p += 8 + size + (size & 1);
  }
  return null;
}

function targetRate(rate: number | null) {
  if (!rate) return 44100;
  if (MP3_RATES.includes(rate)) return rate;
  return rate % 11025 === 0 ? 44100 : 48000;
}

const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
const mp3Name = (name: string) => name.replace(/\.[^.]+$/, "") + ".mp3";

async function decode(file: File) {
  const buf = await file.arrayBuffer();
  const rate = targetRate(wavSampleRate(buf));
  // An OfflineAudioContext decodes straight to the rate we want
  const ctx = new OfflineAudioContext(2, 1, rate);
  const audio = await ctx.decodeAudioData(buf);
  return { audio, rate };
}

function encode(channels: Float32Array[], sampleRate: number, kbps: number, onProgress: (p: number) => void) {
  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker("/workers/wav-to-mp3.worker.js");
    worker.onmessage = (e) => {
      if (e.data.type === "progress") onProgress(e.data.value);
      else if (e.data.type === "done") {
        worker.terminate();
        resolve(new Blob(e.data.parts, { type: "audio/mpeg" }));
      } else {
        worker.terminate();
        reject(new Error(e.data.message || "Encoding failed"));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || "Encoding failed"));
    };
    worker.postMessage({ channels, sampleRate, kbps }, channels.map((c) => c.buffer));
  });
}

export default function WavToMp3() {
  const showSidebar = useShowJoinSidebar();
  const [kbps, setKbps] = useState(320);
  const [mono, setMono] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const busy = useRef(false);
  const settings = useRef({ kbps, mono });
  settings.current = { kbps, mono };

  const update = (id: number, patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  // Convert waiting files one at a time
  useEffect(() => {
    if (busy.current) return;
    const job = jobs.find((j) => j.status === "waiting");
    if (!job) return;
    busy.current = true;
    (async () => {
      try {
        update(job.id, { status: "decoding" });
        const { audio, rate } = await decode(job.file);
        const left = audio.getChannelData(0);
        const right = audio.numberOfChannels > 1 ? audio.getChannelData(1) : null;
        let channels: Float32Array[];
        if (settings.current.mono || !right) {
          const m = new Float32Array(left.length);
          for (let i = 0; i < m.length; i++) m[i] = right ? (left[i] + right[i]) / 2 : left[i];
          channels = [m];
        } else {
          channels = [left.slice(), right.slice()];
        }
        update(job.id, { status: "encoding", progress: 0 });
        const blob = await encode(channels, rate, settings.current.kbps, (p) => update(job.id, { progress: p }));
        update(job.id, { status: "done", progress: 1, url: URL.createObjectURL(blob), size: blob.size });
      } catch (err) {
        update(job.id, {
          status: "error",
          error: err instanceof Error && /decode/i.test(err.message) ? "This file couldn't be read as audio." : String((err as Error)?.message || err),
        });
      } finally {
        busy.current = false;
        setJobs((js) => [...js]); // look for the next waiting file
      }
    })();
  }, [jobs]);

  useEffect(() => () => jobs.forEach((j) => j.url && URL.revokeObjectURL(j.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (files: FileList | null | undefined) => {
    if (!files?.length) return;
    const added = Array.from(files).map((file) => ({ id: nextId.current++, file, status: "waiting" as const, progress: 0 }));
    setJobs((js) => [...added, ...js]);
  };

  const label = (j: Job) => {
    switch (j.status) {
      case "waiting": return "Waiting…";
      case "decoding": return "Reading…";
      case "encoding": return `Converting ${Math.round(j.progress * 100)}%`;
      case "done": return `MP3 · ${fmtSize(j.size || 0)}`;
      default: return j.error;
    }
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div id="wav-mp3-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div className={toolPaneClass(showSidebar, "p-4 sm:p-8")} style={{ background: "#f9fafb", color: "#181b20" }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">Free WAV to MP3 Converter</h1>
            <p className="text-center text-gray-600 mb-6">
              Convert WAV files to high-quality MP3 up to 320 kbps. Converted in your browser, so your music never leaves your device.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {BITRATES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setKbps(b)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${kbps === b ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {b} kbps
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={mono} onChange={(e) => setMono(e.target.checked)} />
                Mono
              </label>
            </div>

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
              <p className="font-semibold">Drop WAV files here, or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">WAV (also AIFF and FLAC) · several at once is fine</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="audio/wav,audio/x-wav,.wav,.wave,.aif,.aiff,.flac,audio/*"
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
                      <p className={`text-xs ${j.status === "error" ? "text-red-600" : "text-gray-500"}`}>{label(j)}</p>
                      {(j.status === "encoding" || j.status === "decoding") && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-blue-600 transition-[width]" style={{ width: `${Math.round(j.progress * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    {j.status === "done" && j.url && (
                      <a
                        href={j.url}
                        download={mp3Name(j.file.name)}
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
              <h2 className="text-lg font-semibold text-gray-800">Which bitrate should I pick?</h2>
              <p>
                <strong>320 kbps</strong> is the highest MP3 quality and the best choice for sending songs, DJ sets and demos.
                <strong> 256</strong> and <strong>192 kbps</strong> make smaller files that still sound good, and <strong>128 kbps</strong> is
                fine for voice memos and quick previews. Keep your WAV as the master: MP3 is lossy, so converting back won&apos;t restore quality.
              </p>
            </div>
          </div>
        </div>
        <ToolJoinSidebar show={showSidebar} />
      </div>
      <style>{`
        #wav-mp3-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #wav-mp3-bg { flex-direction: row !important; } }
      `}</style>
      <ToolSeo slug="WAV-to-MP3" />
      <Footer />
    </>
  );
}
