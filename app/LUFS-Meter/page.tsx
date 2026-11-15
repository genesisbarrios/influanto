"use client";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolJoinSidebar, { useShowJoinSidebar, toolPaneClass } from "@/components/ToolJoinSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { measureLoudness, STREAMING_TARGETS, type LoudnessResult } from "@/libs/loudness";

// Free LUFS meter: everything runs in the browser (Web Audio decodes the
// file; libs/loudness.ts measures it per ITU-R BS.1770-4 / EBU R128).

type Readout = "integrated" | "shortTerm" | "momentary" | "truePeak" | "lra";
const READOUTS: { key: Readout; label: string; unit: string; help: string }[] = [
  { key: "integrated", label: "Integrated", unit: "LUFS", help: "Average loudness of the whole track (gated). What streaming services normalize to." },
  { key: "shortTerm", label: "Short-term", unit: "LUFS", help: "Loudness over the last 3 seconds. Live while playing; otherwise the loudest 3 s." },
  { key: "momentary", label: "Momentary", unit: "LUFS", help: "Loudness over the last 400 ms. Live while playing; otherwise the loudest moment." },
  { key: "truePeak", label: "True Peak", unit: "dBTP", help: "Highest peak including between-sample peaks (4x oversampled). Keep it under -1 dBTP for streaming." },
  { key: "lra", label: "Loudness Range", unit: "LU", help: "How much the loudness varies across the track (EBU R128 LRA)." },
];

const fmt = (v: number, digits = 1) => (Number.isFinite(v) ? v.toFixed(digits) : "-∞");
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Loudness over time (Momentary or Short-term), with the integrated level and a reference line.
// eslint-disable-next-line no-unused-vars -- parameter name in the onSeek type
function LoudnessGraph({ r, series, position, onSeek }: { r: LoudnessResult; series: "momentary" | "shortTerm"; position: number; onSeek: (t: number) => void }) {
  const W = 800, H = 220, TOP = -6, BOTTOM = -48;
  const data = series === "momentary" ? r.momentary : r.shortTerm;
  const y = (v: number) => {
    const c = Math.max(BOTTOM, Math.min(TOP, Number.isFinite(v) ? v : BOTTOM));
    return ((TOP - c) / (TOP - BOTTOM)) * H;
  };
  const n = data.length;
  // Downsample to at most ~W points (max per bucket, so peaks show)
  const points = useMemo(() => {
    const per = Math.max(1, Math.ceil(n / W));
    const pts: string[] = [];
    for (let i = 0; i < n; i += per) {
      let m = -Infinity;
      for (let j = i; j < Math.min(n, i + per); j++) if (data[j] > m) m = data[j];
      pts.push(`${((i / Math.max(1, n - 1)) * W).toFixed(1)},${y(m).toFixed(1)}`);
    }
    return pts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, n]);
  const grid = [-6, -12, -18, -24, -30, -36, -42, -48];
  const cursor = r.duration ? (position / r.duration) * W : 0;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-48 sm:h-56 cursor-pointer select-none"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${series === "momentary" ? "Momentary" : "Short-term"} loudness over time`}
      onClick={(e) => {
        const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        onSeek(((e.clientX - box.left) / box.width) * r.duration);
      }}
    >
      <rect x={0} y={0} width={W} height={H} fill="#0f172a" />
      {grid.map((g) => (
        <g key={g}>
          <line x1={0} x2={W} y1={y(g)} y2={y(g)} stroke="#1e293b" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={4} y={y(g) - 2} fill="#64748b" fontSize={10}>{g}</text>
        </g>
      ))}
      <line x1={0} x2={W} y1={y(-14)} y2={y(-14)} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <text x={W - 4} y={y(-14) - 3} fill="#f59e0b" fontSize={10} textAnchor="end">-14 (Spotify/YouTube)</text>
      {Number.isFinite(r.integrated) && (
        <>
          <line x1={0} x2={W} y1={y(r.integrated)} y2={y(r.integrated)} stroke="#22c55e" strokeDasharray="2 3" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <text x={W - 4} y={y(r.integrated) + 12} fill="#22c55e" fontSize={10} textAnchor="end">integrated {fmt(r.integrated)}</text>
        </>
      )}
      <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <line x1={cursor} x2={cursor} y1={0} y2={H} stroke="#fff" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.8} />
    </svg>
  );
}

// Horizontal meter bar for a live reading
function MeterBar({ label, value }: { label: string; value: number }) {
  const MIN = -48, MAX = 0;
  const pct = Number.isFinite(value) ? Math.max(0, Math.min(1, (value - MIN) / (MAX - MIN))) * 100 : 0;
  const color = value > -9 ? "#ef4444" : value > -14 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-left text-xs font-semibold text-gray-600">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-20 text-right font-mono text-sm tabular-nums">{fmt(value)} LUFS</span>
    </div>
  );
}

export default function LUFSMeter() {
  const showSidebar = useShowJoinSidebar();
  const [result, setResult] = useState<LoudnessResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [readout, setReadout] = useState<Readout>("integrated");
  const [series, setSeries] = useState<"momentary" | "shortTerm">("shortTerm");
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string>("");

  const analyze = useCallback(async (file?: File) => {
    if (!file) return;
    setError("");
    setAnalyzing(true);
    setResult(null);
    setPlaying(false);
    audioRef.current?.pause();
    try {
      const buf = await file.arrayBuffer();
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const audio = await ctx.decodeAudioData(buf);
      ctx.close().catch(() => {});
      // Let the "Analyzing…" state paint before the (CPU-heavy) measurement
      await new Promise((r) => setTimeout(r, 30));
      const channels = [...Array(audio.numberOfChannels)].map((_, i) => audio.getChannelData(i));
      setResult(measureLoudness(channels, audio.sampleRate));
      setFileName(file.name);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(file);
      const el = audioRef.current ?? new Audio();
      audioRef.current = el;
      el.src = urlRef.current;
      setPosition(0);
    } catch {
      setError("Couldn't read that file. Try a WAV, MP3, AIFF, FLAC or M4A.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Follow playback for the live readings and the graph cursor
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      setPosition(el.currentTime);
      if (!el.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => { setPlaying(true); raf = requestAnimationFrame(tick); };
    const onPause = () => { setPlaying(false); setPosition(el.currentTime); };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, [result]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };
  const seek = (t: number) => {
    const el = audioRef.current;
    if (!el || !result) return;
    el.currentTime = Math.max(0, Math.min(result.duration, t));
    setPosition(el.currentTime);
  };

  // Live values at the playback position (100 ms steps)
  const live = useMemo(() => {
    if (!result) return { m: -Infinity, s: -Infinity };
    const k = Math.min(result.momentary.length - 1, Math.max(0, Math.floor(position / result.stepSeconds)));
    return { m: result.momentary[k], s: result.shortTerm[k] };
  }, [result, position]);
  const showLive = playing || position > 0;

  const big = (() => {
    if (!result) return { value: "--", unit: "LUFS", note: "" };
    switch (readout) {
      case "integrated": return { value: fmt(result.integrated), unit: "LUFS", note: "whole track" };
      case "shortTerm": return showLive ? { value: fmt(live.s), unit: "LUFS", note: `at ${fmtTime(position)}` } : { value: fmt(result.shortTermMax), unit: "LUFS", note: "max" };
      case "momentary": return showLive ? { value: fmt(live.m), unit: "LUFS", note: `at ${fmtTime(position)}` } : { value: fmt(result.momentaryMax), unit: "LUFS", note: "max" };
      case "truePeak": return { value: fmt(result.truePeak), unit: "dBTP", note: result.truePeak > -1 ? "over -1 dBTP: may distort after encoding" : "" };
      case "lra": return { value: fmt(result.lra), unit: "LU", note: "" };
    }
  })();
  const active = READOUTS.find((r) => r.key === readout)!;

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) analyze(f);
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div id="lufs-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div className={toolPaneClass(showSidebar, "p-4 sm:p-8")} style={{ background: "#f9fafb", color: "#181b20" }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">Free LUFS Meter</h1>
            <p className="text-center text-gray-600 mb-6">
              Check integrated, short-term and momentary loudness, loudness range and true peak. Your file never leaves your device.
            </p>

            {/* Drop zone / file picker */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400"}`}
            >
              <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-2xl text-blue-600 mb-2" />
              <p className="font-semibold">{analyzing ? "Analyzing…" : "Drop an audio file here, or click to upload"}</p>
              <p className="text-xs text-gray-500 mt-1">WAV, MP3, AIFF, FLAC, M4A{fileName && !analyzing ? ` · measured: ${fileName}` : ""}</p>
              <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.aiff,.aif,.flac,.m4a" className="hidden" onChange={(e) => { analyze(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            {error && <p className="text-sm text-red-600 mt-3 text-center">{error}</p>}

            {/* Readout selector + big number */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
                {READOUTS.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setReadout(r.key)}
                    className={`flex-1 whitespace-nowrap px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${readout === r.key ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="text-center py-6">
                <div className="font-bold tabular-nums leading-none" style={{ fontSize: "clamp(3.5rem, 12vw, 6rem)" }}>
                  {big.value}
                  <span className="text-2xl font-semibold text-gray-400 ml-2">{big.unit}</span>
                </div>
                {big.note && <p className="text-sm text-gray-500 mt-2">{big.note}</p>}
                <p className="text-xs text-gray-500 mt-3 max-w-md mx-auto">{active.help}</p>
              </div>

              {result && (
                <>
                  {/* All values at a glance */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                    {[
                      ["Integrated", `${fmt(result.integrated)} LUFS`],
                      ["Short-term max", `${fmt(result.shortTermMax)} LUFS`],
                      ["Momentary max", `${fmt(result.momentaryMax)} LUFS`],
                      ["Loudness range", `${fmt(result.lra)} LU`],
                      ["True peak", `${fmt(result.truePeak)} dBTP`],
                      ["Sample peak", `${fmt(result.samplePeak)} dBFS`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-gray-200 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">{k}</p>
                        <p className="font-mono text-sm sm:text-base tabular-nums">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Playback with live readings */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-3">
                      <button type="button" className="btn btn-sm btn-primary" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
                        <FontAwesomeIcon icon={playing ? faPause : faPlay} /> {playing ? "Pause" : "Play"}
                      </button>
                      <span className="font-mono text-sm tabular-nums text-gray-600">{fmtTime(position)} / {fmtTime(Math.round(result.duration))}</span>
                    </div>
                    <MeterBar label="Momentary" value={showLive ? live.m : result.momentaryMax} />
                    <MeterBar label="Short-term" value={showLive ? live.s : result.shortTermMax} />
                  </div>

                  {/* Graph */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <h2 className="font-semibold text-sm">Loudness over time</h2>
                      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        {(["shortTerm", "momentary"] as const).map((sr) => (
                          <button key={sr} type="button" onClick={() => setSeries(sr)} className={`px-2 py-0.5 rounded-md text-xs font-medium ${series === sr ? "bg-white shadow text-blue-700" : "text-gray-500"}`}>
                            {sr === "shortTerm" ? "Short-term" : "Momentary"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden">
                      <LoudnessGraph r={result} series={series} position={position} onSeek={seek} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Click the graph to jump there.</p>
                  </div>

                  {/* Streaming normalization */}
                  <div className="mt-6">
                    <h2 className="font-semibold text-sm mb-2">On streaming services</h2>
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr><th>Service</th><th className="text-right">Target</th><th>What happens to this track</th></tr>
                        </thead>
                        <tbody>
                          {STREAMING_TARGETS.map((t) => {
                            const diff = Number.isFinite(result.integrated) ? result.integrated - t.lufs : NaN;
                            return (
                              <tr key={t.name}>
                                <td>{t.name}</td>
                                <td className="text-right font-mono">{t.lufs} LUFS</td>
                                <td className="text-sm">
                                  {Number.isNaN(diff) ? "—"
                                    : diff > 0.2 ? <>Turned down <strong>{diff.toFixed(1)} dB</strong></>
                                    : diff < -0.2 ? <>{Math.abs(diff).toFixed(1)} dB quieter than the target</>
                                    : "Right at the target"}
                                  {result.truePeak > t.peak && <span className="text-amber-600"> · peaks above {t.peak} dBTP</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Typical normalization levels; services change them and some let listeners choose. Most only turn quieter tracks up if there&apos;s peak headroom.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 text-sm text-gray-600 space-y-2 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-800">What is LUFS?</h2>
              <p>
                LUFS (Loudness Units relative to Full Scale) measures how loud music sounds to people, not just how high its peaks are.
                Streaming services measure every song&apos;s <strong>integrated</strong> loudness and turn louder songs down to a target, so a
                master that&apos;s louder than the target doesn&apos;t play any louder, it just loses dynamics.
              </p>
              <p>
                <strong>Short-term</strong> (3 s) and <strong>momentary</strong> (400 ms) loudness show how it moves through the song.
                <strong> Loudness range</strong> shows how much it varies, and <strong>true peak</strong> catches peaks between samples that can
                distort after MP3 or AAC encoding. This meter follows ITU-R BS.1770-4 and EBU R128.
              </p>
            </div>
          </div>
        </div>
        <ToolJoinSidebar show={showSidebar} />
      </div>
      <style>{`
        #lufs-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #lufs-bg { flex-direction: row !important; } }
      `}</style>
      <Footer />
    </>
  );
}
