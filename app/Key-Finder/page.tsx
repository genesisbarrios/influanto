"use client";
import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faMusic, faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Krumhansl–Schmuckler key profiles
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// ── Iterative radix-2 FFT (in place) ──────────────────────────────────────────
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlRe = Math.cos(ang), wlIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1, wIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const vRe = re[b] * wRe - im[b] * wIm;
        const vIm = re[b] * wIm + im[b] * wRe;
        re[b] = re[a] - vRe; im[b] = im[a] - vIm;
        re[a] += vRe; im[a] += vIm;
        const nwRe = wRe * wlRe - wIm * wlIm;
        wIm = wRe * wlIm + wIm * wlRe; wRe = nwRe;
      }
    }
  }
}

// Add a magnitude spectrum's energy into a 12-bin chroma vector by pitch class.
function addToChroma(magAt: (k: number) => number, bins: number, sampleRate: number, fftSize: number, chroma: number[]) {
  const minF = 55, maxF = 2093; // A1 .. C7
  for (let k = 1; k < bins; k++) {
    const f = (k * sampleRate) / fftSize;
    if (f < minF || f > maxF) continue;
    const pc = ((Math.round(12 * Math.log2(f / 16.3516)) % 12) + 12) % 12;
    chroma[pc] += magAt(k);
  }
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

interface KeyResult { name: string; score: number }

interface SongMeta { title?: string; artist?: string; album?: string; genre?: string; year?: string; picture?: string }

// Read embedded ID3 / MP4 / FLAC tags (incl. album art) from the file. Best-effort.
async function readTags(file: File): Promise<SongMeta | null> {
  try {
    // Use the prebuilt browser bundle — the default entry pulls in Node fs deps.
    // @ts-ignore - no types for the dist path
    const mod: any = await import("jsmediatags/dist/jsmediatags.min.js");
    const jsmediatags = mod.default || mod;
    return await new Promise<SongMeta | null>((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (res: any) => {
          const t = res?.tags || {};
          let picture: string | undefined;
          if (t.picture?.data?.length) {
            const { data, format } = t.picture;
            let bin = "";
            const chunk = 0x8000;
            for (let i = 0; i < data.length; i += chunk) bin += String.fromCharCode.apply(null, data.slice(i, i + chunk));
            picture = `data:${format || "image/jpeg"};base64,${btoa(bin)}`;
          }
          resolve({ title: t.title, artist: t.artist, album: t.album, genre: t.genre, year: t.year, picture });
        },
        onError: () => resolve(null),
      });
    });
  } catch {
    return null;
  }
}

function detectKey(chroma: number[]): KeyResult | null {
  const total = chroma.reduce((s, v) => s + v, 0);
  if (total <= 0) return null;
  let best: KeyResult | null = null;
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [prof, mode] of [[MAJOR, "Major"], [MINOR, "Minor"]] as [number[], string][]) {
      const rotated = prof.map((_, i) => prof[(i - tonic + 12) % 12]);
      const score = pearson(chroma, rotated);
      if (!best || score > best.score) best = { name: `${NOTE_NAMES[tonic]} ${mode}`, score };
    }
  }
  return best;
}

export default function KeyFinder() {
  const [result, setResult] = useState<KeyResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<SongMeta | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const chromaRef = useRef<number[]>(new Array(12).fill(0));

  useEffect(() => {
    document.title = "Song Key Finder - Detect the Key of Any Song | Influanto";
    const meta = (name: string, attr: string, val: string) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    const desc = "Free song key finder. Upload a track or use your mic to detect the musical key (major/minor) of any song. Producer tools by Influanto.";
    meta("description", "name", desc);
    meta("og:title", "property", "Song Key Finder | Influanto");
    meta("og:description", "property", desc);
    meta("twitter:title", "name", "Song Key Finder | Influanto");
    meta("twitter:description", "name", desc);
  }, []);

  // ── Upload a song ──
  // Auto-play the uploaded file; revoke the object URL when it changes/unmounts.
  useEffect(() => {
    if (!audioUrl) return;
    audioRef.current?.play().catch(() => {});
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(""); setResult(null); setAnalyzing(true); setMeta(null);
    setAudioUrl(URL.createObjectURL(file)); // playable copy for the audio player
    readTags(file).then(m => { if (m && (m.title || m.artist || m.picture)) setMeta(m); });
    try {
      const arrayBuf = await file.arrayBuffer();
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const audio = await ctx.decodeAudioData(arrayBuf);
      ctx.close().catch(() => {});

      const sr = audio.sampleRate;
      const data = audio.getChannelData(0); // first channel is plenty for key
      const N = 8192;
      const hann = new Float64Array(N);
      for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
      const re = new Float64Array(N), im = new Float64Array(N);
      const chroma = new Array(12).fill(0);

      const maxFrames = 4000;
      const totalFrames = Math.floor(data.length / N);
      const step = Math.max(1, Math.floor(totalFrames / maxFrames));
      for (let f = 0, start = 0; start + N <= data.length; f++, start += N * step) {
        for (let i = 0; i < N; i++) { re[i] = data[start + i] * hann[i]; im[i] = 0; }
        fft(re, im);
        addToChroma((k) => Math.hypot(re[k], im[k]), N / 2, sr, N, chroma);
      }
      const r = detectKey(chroma);
      if (!r) setError("Couldn't detect a key — the track may be too quiet or atonal.");
      setResult(r);
    } catch (e: any) {
      setError("Couldn't read that file. Try a WAV/MP3/M4A audio file.");
    } finally {
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Use microphone ──
  const stopMic = (detect = true) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const ctx = ctxRef.current;
    if (detect) setResult(detectKey(chromaRef.current));
    ctx?.close().catch(() => {});
    ctxRef.current = null; analyserRef.current = null; streamRef.current = null;
    setListening(false);
  };

  const startMic = async () => {
    setError(""); setResult(null); setMeta(null);
    audioRef.current?.pause(); // don't let the uploaded track bleed into the mic
    chromaRef.current = new Array(12).fill(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.frequencyBinCount);
      setListening(true);
      const tick = () => {
        analyser.getFloatFrequencyData(buf as any);
        addToChroma((k) => (buf[k] === -Infinity ? 0 : Math.pow(10, buf[k] / 20)), buf.length, ctx.sampleRate, analyser.fftSize, chromaRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e: any) {
      setError(e?.name === "NotAllowedError" ? "Microphone access was denied." : "Could not access the microphone.");
      setListening(false);
    }
  };

  useEffect(() => () => stopMic(false), []); // cleanup on unmount

  const busy = analyzing || listening;

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div id="key-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%", textAlign: "center" }}>
        {/* Left: Key finder */}
        <div style={{ background: "#f9fafb" }} className="w-full sm:w-3/4 p-8 sm:border-r sm:border-gray-300">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#181b20" }}>Key Finder</h1>
          <p style={{ color: "#181b20" }}>Upload a song or use your mic to detect its key.</p>

          {/* Result */}
          <div style={{ margin: "0.4em 0", userSelect: "none", lineHeight: 1.05 }}>
            <span style={{ fontSize: "clamp(4.5rem, 9vw, 10rem)", fontWeight: 700, color: "#181b20" }}>
              {analyzing ? "…" : result ? result.name.split(" ")[0] : "?"}
            </span>
            {result && !analyzing && (
              <div style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 700, color: "#6b7280", marginTop: "-0.2em" }}>
                {result.name.split(" ")[1]}
              </div>
            )}
          </div>

          {result && !analyzing && (
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              Estimated key · match strength {Math.round(Math.max(0, result.score) * 100)}%
            </p>
          )}
          {analyzing && <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Analyzing…</p>}
          {listening && <p style={{ color: "#2563eb", marginBottom: "1rem" }}><FontAwesomeIcon icon={faMicrophone} className="mr-2" /> Listening — play the song, then press Detect Key</p>}
          {error && <p style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

          {meta && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: "flex-start", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "0.75rem 1rem", maxWidth: 480, margin: "0 auto 0.75rem", textAlign: "left" }}>
              {meta.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.picture} alt="Album art" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, color: "#9ca3af" }}><FontAwesomeIcon icon={faMusic} /></div>
              )}
              <div style={{ minWidth: 0 }}>
                {meta.title && <div style={{ fontWeight: 700, color: "#181b20", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.title}</div>}
                {meta.artist && <div style={{ color: "#374151", fontSize: "0.95rem" }}>{meta.artist}</div>}
                {(meta.album || meta.genre || meta.year) && (
                  <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>{[meta.album, meta.genre, meta.year].filter(Boolean).join(" · ")}</div>
                )}
              </div>
            </div>
          )}

          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} controls style={{ width: "100%", maxWidth: 480, margin: "0 auto 1.25rem", display: "block" }} />
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.75rem", fontSize: "1.05rem", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.6 : 1 }}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <FontAwesomeIcon icon={faArrowUpFromBracket} className="mr-2" /> Upload a song
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.75rem", fontSize: "1.05rem", borderRadius: 8, background: listening ? "#dc2626" : "#16a34a", color: "#fff", border: "none", cursor: "pointer", opacity: analyzing ? 0.6 : 1 }}
              disabled={analyzing}
              onClick={listening ? () => stopMic(true) : startMic}
            >
              {listening ? "Detect Key" : <><FontAwesomeIcon icon={faMicrophone} className="mr-2" /> Use microphone</>}
            </button>
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>

          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "1.25rem", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Detection is an estimate — relative major/minor keys share the same notes, and songs that change key will not have a single answer.
          </p>
        </div>

        {/* Right: Sign up */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }} className="w-full sm:w-1/4 p-8">
          <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
          <button
            className="btn btn-primary"
            style={{ padding: "0.75rem 2rem", fontSize: "1.1rem", borderRadius: 8, marginBottom: "1.5rem", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}
            onClick={() => (window.location.href = "api/auth/signin?callbackUrl=/dashboard")}
          >
            Sign Up
          </button>
          <div style={{ textAlign: "center" }}>
            <p>Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.</p>
          </div>
        </div>
      </div>
      <style>{`
        #key-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #key-bg { flex-direction: row !important; } }
      `}</style>
      <Footer />
    </>
  );
}
