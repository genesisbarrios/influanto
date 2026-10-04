"use client";
import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SeoContent from "@/components/SeoContent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStop, faMinus, faPlus, faHandPointer } from "@fortawesome/free-solid-svg-icons";

const Metronome3D = dynamic(() => import("@/components/Metronome3D"), { ssr: false });

const MIN_BPM = 30;
const MAX_BPM = 260;
const MAX_SWING = 0.42; // radians each side of center
const LOOKAHEAD_S = 0.12; // schedule clicks this far ahead of the audio clock
const SCHEDULER_MS = 25;

const TIME_SIGNATURES = [
  { label: "1/4", beats: 1 }, { label: "2/4", beats: 2 }, { label: "3/4", beats: 3 },
  { label: "4/4", beats: 4 }, { label: "5/4", beats: 5 }, { label: "6/8", beats: 6 }, { label: "7/8", beats: 7 },
];
const SUBDIVISIONS = [
  { label: "Quarter notes", value: 1 }, { label: "Eighth notes", value: 2 },
  { label: "Triplets", value: 3 }, { label: "Sixteenth notes", value: 4 },
];

function tempoMarking(bpm: number) {
  if (bpm < 60) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}

const clampBpm = (n: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(n)));

export default function MetronomePage() {
  const [bpm, setBpm] = useState(120);
  const [running, setRunning] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [accent, setAccent] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [currentBeat, setCurrentBeat] = useState(-1);

  // Audio + timing state lives in refs so the scheduler never reads stale values
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const settings = useRef({ bpm, beatsPerBar, subdivision, accent });
  settings.current = { bpm, beatsPerBar, subdivision, accent };
  // Beat timeline anchor: beat number `anchorBeat` happens at audio time `anchorTime`
  const timeline = useRef({ anchorTime: 0, anchorBeat: 0, nextTick: 0 });
  const runningRef = useRef(false);
  const restAngle = useRef(0);
  const tapTimes = useRef<number[]>([]);

  const beatDur = () => 60 / settings.current.bpm;
  const beatsAt = (t: number) => timeline.current.anchorBeat + (t - timeline.current.anchorTime) / beatDur();

  const playClick = (time: number, kind: "accent" | "beat" | "sub") => {
    const ctx = ctxRef.current!, out = gainRef.current!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.value = kind === "accent" ? 1600 : kind === "beat" ? 1100 : 800;
    const peak = kind === "sub" ? 0.35 : 1;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(peak, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(env).connect(out);
    osc.start(time);
    osc.stop(time + 0.06);
  };

  // Schedules every subdivision tick that falls inside the lookahead window
  const schedule = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { subdivision: sub, beatsPerBar: bar, accent: acc } = settings.current;
    const tl = timeline.current;
    const horizon = ctx.currentTime + LOOKAHEAD_S;
    for (;;) {
      const tickBeat = tl.nextTick / sub;
      const time = tl.anchorTime + (tickBeat - tl.anchorBeat) * beatDur();
      if (time > horizon) break;
      const isBeat = tl.nextTick % sub === 0;
      const beatIndex = Math.floor(tickBeat) % bar;
      if (time >= ctx.currentTime - 0.01) {
        playClick(time, isBeat ? (acc && beatIndex === 0 ? "accent" : "beat") : "sub");
        if (isBeat) {
          const delay = Math.max(0, (time - ctx.currentTime) * 1000);
          window.setTimeout(() => runningRef.current && setCurrentBeat(beatIndex), delay);
        }
      }
      tl.nextTick++;
    }
  };

  const start = async () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.connect(ctxRef.current.destination);
    }
    const ctx = ctxRef.current;
    await ctx.resume();
    gainRef.current!.gain.value = volume;
    const t0 = ctx.currentTime + 0.06;
    timeline.current = { anchorTime: t0, anchorBeat: 0, nextTick: 0 };
    runningRef.current = true;
    setRunning(true);
    schedule();
    timerRef.current = window.setInterval(schedule, SCHEDULER_MS);
  };

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const ctx = ctxRef.current;
    if (ctx && runningRef.current) {
      const b = beatsAt(ctx.currentTime);
      restAngle.current = b >= 0 ? MAX_SWING * Math.cos(Math.PI * b) : 0;
    }
    runningRef.current = false;
    setRunning(false);
    setCurrentBeat(-1);
  }, []);

  const toggle = () => (runningRef.current ? stop() : start());

  // Re-anchor the timeline on tempo changes so the beat (and pendulum) stay continuous
  const changeBpm = (next: number) => {
    const n = clampBpm(next);
    const ctx = ctxRef.current;
    if (ctx && runningRef.current) {
      const now = ctx.currentTime;
      const tl = timeline.current;
      const b = beatsAt(now);
      tl.anchorBeat = b;
      tl.anchorTime = now;
      settings.current.bpm = n;
      // Skip ticks already in the past on the new timeline
      tl.nextTick = Math.max(tl.nextTick, Math.ceil(b * settings.current.subdivision));
    }
    setBpm(n);
  };

  const tap = () => {
    const now = performance.now();
    const taps = tapTimes.current.filter(t => now - t < 2500);
    taps.push(now);
    tapTimes.current = taps.slice(-6);
    if (tapTimes.current.length >= 2) {
      const gaps = tapTimes.current.slice(1).map((t, i) => t - tapTimes.current[i]);
      changeBpm(60000 / (gaps.reduce((a, g) => a + g, 0) / gaps.length));
    }
  };

  // Pendulum angle for the 3D model: at each extreme exactly on the click
  const getAngle = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx && runningRef.current) {
      const b = beatsAt(ctx.currentTime);
      return b < 0 ? MAX_SWING : MAX_SWING * Math.cos(Math.PI * b);
    }
    restAngle.current *= 0.92; // ease back to center when stopped
    return restAngle.current;
  }, []);

  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = volume; }, [volume]);
  // Subdivision changed mid-play: continue on the new tick grid, after the clicks already scheduled
  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx && runningRef.current) {
      timeline.current.nextTick = Math.ceil(beatsAt(ctx.currentTime + LOOKAHEAD_S) * subdivision);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdivision]);

  // Space = start/stop, arrow keys = tempo (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      if (e.code === "ArrowUp" || e.code === "ArrowRight") { e.preventDefault(); changeBpm(settings.current.bpm + 1); }
      if (e.code === "ArrowDown" || e.code === "ArrowLeft") { e.preventDefault(); changeBpm(settings.current.bpm - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => { stop(); ctxRef.current?.close(); }, [stop]);

  const btn = "btn btn-sm sm:btn-md border-none";

  return (
    <>
      <Suspense><Header /></Suspense>
      <div id="metronome-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%", textAlign: "center" }}>
        {/* Left: metronome */}
        <div style={{ background: "#f9fafb", color: "#181b20" }} className="w-full sm:w-3/4 p-6 sm:p-8 sm:border-r sm:border-gray-300">
          <h1 className="text-3xl font-bold mb-2">Free Online Metronome</h1>
          <p className="mb-4 opacity-80">Press play or hit the spacebar. Use the arrow keys to nudge the tempo.</p>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
            <div style={{ width: "min(100%, 340px)", height: 380 }}>
              <Metronome3D getAngle={getAngle} />
            </div>

            <div className="flex flex-col items-center gap-4 w-full max-w-md">
              <div>
                <div style={{ fontSize: "clamp(4.5rem, 10vw, 6.5rem)", fontWeight: 800, lineHeight: 1 }}>{bpm}</div>
                <div className="text-sm font-semibold uppercase tracking-widest opacity-60 mt-1">BPM · {tempoMarking(bpm)}</div>
              </div>

              {/* Beat indicator */}
              <div className="flex gap-2 justify-center flex-wrap" aria-hidden>
                {Array.from({ length: beatsPerBar }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 18, height: 18, borderRadius: 99,
                      background: currentBeat === i ? (i === 0 && accent ? "#1d4ed8" : "#60a5fa") : "#dbe3ef",
                      transform: currentBeat === i ? "scale(1.25)" : "none",
                      transition: "transform 80ms, background 80ms",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 w-full">
                <button className={btn} style={{ background: "#e5e7eb", color: "#181b20" }} onClick={() => changeBpm(bpm - 1)} aria-label="Slower"><FontAwesomeIcon icon={faMinus} /></button>
                <input
                  type="range" min={MIN_BPM} max={MAX_BPM} value={bpm}
                  onChange={e => changeBpm(Number(e.target.value))}
                  className="range range-primary range-sm flex-1" aria-label="Tempo (BPM)"
                />
                <button className={btn} style={{ background: "#e5e7eb", color: "#181b20" }} onClick={() => changeBpm(bpm + 1)} aria-label="Faster"><FontAwesomeIcon icon={faPlus} /></button>
              </div>

              <div className="flex gap-3 w-full">
                <button className={`${btn} flex-1`} style={{ background: running ? "#181b20" : "#2563eb", color: "#fff" }} onClick={toggle}>
                  <FontAwesomeIcon icon={running ? faStop : faPlay} className="mr-2" />{running ? "Stop" : "Start"}
                </button>
                <button className={`${btn} flex-1`} style={{ background: "#e5e7eb", color: "#181b20" }} onClick={tap}>
                  <FontAwesomeIcon icon={faHandPointer} className="mr-2" />Tap Tempo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full text-left text-sm">
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Time signature</span>
                  <select className="select select-sm select-bordered bg-white text-black" value={beatsPerBar} onChange={e => setBeatsPerBar(Number(e.target.value))}>
                    {TIME_SIGNATURES.map(t => <option key={t.label} value={t.beats}>{t.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Subdivision</span>
                  <select className="select select-sm select-bordered bg-white text-black" value={subdivision} onChange={e => setSubdivision(Number(e.target.value))}>
                    {SUBDIVISIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Volume</span>
                  <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="range range-primary range-xs mt-2" />
                </label>
                <label className="flex items-center gap-2 mt-5 cursor-pointer">
                  <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={accent} onChange={e => setAccent(e.target.checked)} />
                  <span className="font-semibold">Accent beat 1</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: sign up */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", color: "#181b20" }} className="w-full sm:w-1/4 p-8">
          <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
          <button
            className="btn btn-primary"
            style={{ padding: "0.75rem 2rem", fontSize: "1.1rem", borderRadius: 8, marginBottom: "1.5rem", background: "#2563eb", color: "#fff", border: "none" }}
            onClick={() => (window.location.href = "/api/auth/signin?callbackUrl=/dashboard")}
          >
            Sign Up
          </button>
          <p>Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.</p>
        </div>
      </div>

      <SeoContent
          sections={[
            {
              heading: "How to Use This Online Metronome",
              body: (
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Set your tempo with the slider, the + and – buttons, or tap along with Tap Tempo.</li>
                  <li>Choose a time signature like 4/4, 3/4, or 6/8 — beat one is accented so you always know where the bar starts.</li>
                  <li>Add subdivisions (eighth notes, triplets, or sixteenths) to lock in faster rhythms.</li>
                  <li>Press Start or the spacebar, and use the arrow keys to adjust the BPM while you play.</li>
                </ol>
              ),
            },
            {
              heading: "Why Practice With a Metronome?",
              body: (
                <p>
                  Practicing with a metronome builds steady timing, which is what makes a band sound tight and a recording easy to edit. Start a passage slow enough to play cleanly, then raise the BPM a few beats at a time. Producers can also use it to check a song&apos;s tempo before setting up a session — or find it with our <a href="/BPM-Calculator" className="link link-primary">BPM calculator</a>.
                </p>
              ),
            },
          ]}
          faqs={[
            { q: "Is this metronome free?", a: "Yes. The Influanto metronome is free to use in your browser with no download or sign-up required." },
            { q: "What BPM should I practice at?", a: "Start at a tempo where you can play the passage cleanly — often 60 to 80 BPM — then increase it by 2 to 5 BPM once it feels comfortable, until you reach the song's target tempo." },
            { q: "What do tempo markings like Andante and Allegro mean?", a: "They're traditional tempo names. Roughly: Largo is very slow (under 60 BPM), Adagio is slow (66–76), Andante is a walking pace (76–108), Moderato is moderate (108–120), Allegro is fast (120–156), and Presto is very fast (168–200)." },
            { q: "Can I use this metronome with headphones or on my phone?", a: "Yes. It runs in any modern browser on desktop or mobile, and plays through whatever speakers or headphones your device is using." },
            { q: "Does the metronome support odd time signatures?", a: "Yes. Choose from 1/4, 2/4, 3/4, 4/4, 5/4, 6/8, and 7/8, with an optional accent on the first beat of each bar." },
          ]}
          related={[
            { href: "/BPM-Calculator", label: "BPM calculator" },
            { href: "/Tuner", label: "Chromatic tuner" },
            { href: "/Ear-Training", label: "Ear training" },
            { href: "/tools", label: "All free music tools" },
          ]}
      />

      <style>{`
        #metronome-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #metronome-bg { flex-direction: row !important; } }
      `}</style>
      <Footer />
    </>
  );
}
