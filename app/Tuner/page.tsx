"use client";
import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ── Pitch detection (autocorrelation, ACF2+) ──────────────────────────────────
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // too quiet to read

  // Trim leading/trailing silence
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

  const trimmed = buf.slice(r1, r2);
  const n = trimmed.length;
  const c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) c[i] += trimmed[j] * trimmed[j + i];

  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < n; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  let T0 = maxpos;
  if (T0 <= 0) return -1;

  // Parabolic interpolation for a finer estimate
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1] ?? c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

function noteFromPitch(freq: number): number {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69;
}
function frequencyFromNote(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
function centsOff(freq: number, note: number): number {
  return Math.floor((1200 * Math.log(freq / frequencyFromNote(note))) / Math.log(2));
}

export default function Tuner() {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string>("–");
  const [octave, setOctave] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [freq, setFreq] = useState(0);
  const [error, setError] = useState("");

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufRef = useRef<Float32Array | null>(null);

  // SEO
  useEffect(() => {
    document.title = "Chromatic Tuner - Tune Any Instrument | Influanto";
    const meta = (name: string, attr: string, val: string) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    const desc = "Free online chromatic tuner. Tune guitar, bass, violin, ukulele, or any instrument using your microphone. Producer tools by Influanto.";
    meta("description", "name", desc);
    meta("og:title", "property", "Chromatic Tuner | Influanto");
    meta("og:description", "property", desc);
    meta("twitter:title", "name", "Chromatic Tuner | Influanto");
    meta("twitter:description", "name", desc);
  }, []);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null; analyserRef.current = null; streamRef.current = null;
    setListening(false);
    setNote("–"); setOctave(null); setCents(0); setFreq(0);
  };

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      ctx.createMediaStreamSource(stream).connect(analyser);
      setListening(true);
      loop();
    } catch (e: any) {
      setError(e?.name === "NotAllowedError" ? "Microphone access was denied." : "Could not access the microphone.");
      setListening(false);
    }
  };

  const loop = () => {
    const analyser = analyserRef.current, ctx = ctxRef.current, buf = bufRef.current;
    if (!analyser || !ctx || !buf) return;
    analyser.getFloatTimeDomainData(buf as any);
    const f = autoCorrelate(buf, ctx.sampleRate);
    if (f !== -1 && f > 0) {
      const midi = noteFromPitch(f);
      setNote(NOTE_NAMES[(midi % 12 + 12) % 12]);
      setOctave(Math.floor(midi / 12) - 1);
      setCents(Math.max(-50, Math.min(50, centsOff(f, midi))));
      setFreq(f);
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => stop(), []); // cleanup on unmount

  const inTune = listening && freq > 0 && Math.abs(cents) <= 5;
  const needleColor = inTune ? "#16a34a" : Math.abs(cents) <= 15 ? "#d97706" : "#dc2626";
  const statusText = !listening ? "" : freq === 0 ? "Play a note…" : inTune ? "In tune" : cents < 0 ? "♭ Flat — tune up" : "♯ Sharp — tune down";

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div
        id="tuner-bg"
        style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%", textAlign: "center" }}
      >
        {/* Left: Tuner */}
        <div style={{ background: "#f9fafb" }} className="w-full sm:w-3/4 p-8 sm:border-r sm:border-gray-300">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#181b20" }}>Chromatic Tuner</h1>
          <p style={{ color: "#181b20" }}>Tune any instrument with your microphone.</p>

          {/* Note display */}
          <div style={{ margin: "0.5em 0", userSelect: "none", lineHeight: 1 }}>
            <span style={{ fontSize: "clamp(7rem, 11vw, 13rem)", fontWeight: 700, color: inTune ? "#16a34a" : "#181b20" }}>
              {note}
            </span>
            {octave !== null && (
              <span style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, color: "#6b7280" }}>{octave}</span>
            )}
          </div>

          {/* Cents meter */}
          <div style={{ maxWidth: 480, margin: "0 auto 1rem" }}>
            <div style={{ position: "relative", height: 56, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}>
              {/* center line */}
              <div style={{ position: "absolute", left: "50%", top: 6, bottom: 6, width: 2, background: "#9ca3af", transform: "translateX(-1px)" }} />
              {/* tick labels */}
              <span style={{ position: "absolute", left: 8, bottom: 4, fontSize: 11, color: "#9ca3af" }}>-50</span>
              <span style={{ position: "absolute", left: "50%", top: 4, transform: "translateX(-50%)", fontSize: 11, color: "#9ca3af" }}>0</span>
              <span style={{ position: "absolute", right: 8, bottom: 4, fontSize: 11, color: "#9ca3af" }}>+50</span>
              {/* needle */}
              <div style={{
                position: "absolute", top: 4, bottom: 4, width: 4, borderRadius: 2,
                background: needleColor, left: `${50 + cents}%`, transform: "translateX(-2px)",
                transition: "left 0.08s linear, background 0.1s",
                opacity: listening && freq > 0 ? 1 : 0.25,
              }} />
            </div>
            <div style={{ marginTop: 8, minHeight: 24, fontWeight: 600, color: needleColor }}>
              {statusText}
              {listening && freq > 0 && (
                <span style={{ color: "#6b7280", fontWeight: 400 }}>{`  ·  ${freq.toFixed(1)} Hz  ·  ${cents > 0 ? "+" : ""}${cents}¢`}</span>
              )}
            </div>
          </div>

          {error && <p style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

          <button
            className="btn btn-primary w-1/2 m-auto"
            style={{ padding: "0.75rem 2rem", fontSize: "1.1rem", borderRadius: 8, background: listening ? "#dc2626" : "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}
            onClick={listening ? stop : start}
          >
            {listening ? "Stop" : "Start Tuner"}
          </button>
        </div>

        {/* Right: Sign up and info */}
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }}
          className="w-full sm:w-1/4 p-8"
        >
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
        #tuner-bg { background: #638bcf !important; }
        @media (min-width: 640px) {
          #tuner-bg { flex-direction: row !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
