"use client";
// Rhythmic ear training: recognize, perform and build rhythms. Drums are
// synthesized with the Web Audio API (no samples to load), and tap timing is
// read from the audio clock, corrected for the device's output latency.
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateRight, faMusic, faClock, faDrum, faGaugeHigh,
  faCodeCompare, faHandPointer, faWaveSquare, faArrowsLeftRight, faTableCells, faBolt, faPlay,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import EarVisualizer, { audioOut } from "@/components/EarVisualizer";
import Icon3D, { type Icon3DName } from "@/components/Icon3D";
import { accColor, shuffle, pick, sleep, Pills, LEVELS, ChoiceGrid, GameCard, SessionDone, useSession, NextLine } from "@/components/EarTrainingUI";


// ── Drum synth ────────────────────────────────────────────────────────────────

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: AudioContext) {
  let b = noiseCache.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, b);
  }
  return b;
}
function env(ctx: AudioContext, t: number, vol: number, decay: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  g.connect(audioOut(ctx));
  return g;
}
function tone(ctx: AudioContext, t: number, type: "sine" | "square" | "triangle" | "sawtooth", f0: number, f1: number, vol: number, decay: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + decay * 0.6);
  o.connect(env(ctx, t, vol, decay));
  o.start(t);
  o.stop(t + decay + 0.02);
}
function noiseHit(ctx: AudioContext, t: number, filter: "highpass" | "bandpass" | "lowpass", freq: number, vol: number, decay: number, q = 1) {
  const s = ctx.createBufferSource();
  s.buffer = noise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  s.connect(f);
  f.connect(env(ctx, t, vol, decay));
  s.start(t);
  s.stop(t + decay + 0.02);
}
const DRUMS = {
  kick: (c: AudioContext, t: number, v = 0.9) => tone(c, t, "sine", 150, 42, v, 0.32),
  snare: (c: AudioContext, t: number, v = 0.55) => { noiseHit(c, t, "highpass", 1400, v, 0.16); tone(c, t, "triangle", 200, 160, v * 0.5, 0.08); },
  hat: (c: AudioContext, t: number, v = 0.22) => noiseHit(c, t, "highpass", 8000, v, 0.045),
  openHat: (c: AudioContext, t: number, v = 0.2) => noiseHit(c, t, "highpass", 7500, v, 0.28),
  clap: (c: AudioContext, t: number, v = 0.45) => { [0, 0.011, 0.022].forEach((d) => noiseHit(c, t + d, "bandpass", 1300, v, 0.1, 0.9)); },
  rim: (c: AudioContext, t: number, v = 0.35) => tone(c, t, "square", 1700, 1700, v * 0.5, 0.03),
  clave: (c: AudioContext, t: number, v = 0.5) => tone(c, t, "sine", 2500, 2500, v, 0.06),
  block: (c: AudioContext, t: number, v = 0.6) => tone(c, t, "sine", 880, 820, v, 0.09),
  low: (c: AudioContext, t: number, v = 0.6) => tone(c, t, "sine", 440, 420, v, 0.1),
  click: (c: AudioContext, t: number, accent = false) => tone(c, t, "sine", accent ? 1600 : 1050, accent ? 1600 : 1050, accent ? 0.45 : 0.3, 0.035),
};
type DrumName = keyof typeof DRUMS;

function useAudio() {
  const ref = useRef<AudioContext | null>(null);
  const get = () => {
    if (!ref.current || ref.current.state === "closed") {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ref.current = new Ctx();
    }
    if (ref.current.state === "suspended") ref.current.resume();
    return ref.current;
  };
  useEffect(() => () => { ref.current?.close(); }, []);
  return get;
}
// What the listener hears lags what we schedule by the output latency.
const latency = (c: AudioContext) => (c as any).outputLatency || c.baseLatency || 0;

// ── Rhythms (one bar of 4/4, 12 ticks per beat) ───────────────────────────────

type Ev = { ticks: number; rest?: boolean; tuplet?: boolean };
type Rhythm = Ev[];
const BAR = 48;
const n = (ticks: number, rest = false, tuplet = false): Ev => ({ ticks, rest, tuplet });
const r = (ticks: number) => n(ticks, true);
const t3 = (ticks: number, rest = false) => n(ticks, rest, true);

// Building blocks by level: 1 quarters/eighths/halves, 2 + sixteenths and rests,
// 3 + dotted notes and syncopation, 4 + triplets.
const PATTERNS: { level: number; beats: number; evs: Ev[] }[] = [
  { level: 1, beats: 1, evs: [n(12)] },
  { level: 1, beats: 1, evs: [n(6), n(6)] },
  { level: 1, beats: 2, evs: [n(24)] },
  { level: 2, beats: 1, evs: [n(3), n(3), n(3), n(3)] },
  { level: 2, beats: 1, evs: [n(6), n(3), n(3)] },
  { level: 2, beats: 1, evs: [n(3), n(3), n(6)] },
  { level: 2, beats: 1, evs: [r(12)] },
  { level: 2, beats: 1, evs: [r(6), n(6)] },
  { level: 2, beats: 1, evs: [n(6), r(6)] },
  { level: 3, beats: 1, evs: [n(9), n(3)] },
  { level: 3, beats: 1, evs: [n(3), n(6), n(3)] },
  { level: 3, beats: 2, evs: [n(18), n(6)] },
  { level: 3, beats: 2, evs: [n(6), n(12), n(6)] },
  { level: 4, beats: 1, evs: [t3(4), t3(4), t3(4)] },
  { level: 4, beats: 1, evs: [t3(4, true), t3(4), t3(4)] },
  { level: 4, beats: 1, evs: [t3(8), t3(4)] },
];
function makeRhythm(level: number, onlySingleBeats = false): { rhythm: Rhythm; beats: Ev[][] } {
  for (;;) {
    const beats: Ev[][] = [];
    let used = 0;
    while (used < 4) {
      const cands = PATTERNS.filter((p) => p.level <= level && p.beats <= 4 - used && (!onlySingleBeats || p.beats === 1));
      // favour the newest material for the level
      const weighted = cands.flatMap((p) => Array(p.level === level ? 3 : 1).fill(p));
      const p = pick(weighted);
      beats.push(p.evs);
      used += p.beats;
    }
    const rhythm = beats.flat();
    if (rhythm.filter((e) => !e.rest).length >= 2) return { rhythm, beats };
  }
}
const rhythmKey = (rh: Rhythm) => rh.map((e) => `${e.rest ? "r" : ""}${e.ticks}${e.tuplet ? "t" : ""}`).join(",");
const onsets = (rh: Rhythm) => { let t = 0; const out: number[] = []; for (const e of rh) { if (!e.rest) out.push(t); t += e.ticks; } return out; };

// Count-in clicks, then the rhythm on a woodblock. Returns when each onset sounds (audio clock).
function playRhythm(ctx: AudioContext, rh: Rhythm, bpm: number, { countIn = true, at = ctx.currentTime + 0.12, pulse = true } = {}) {
  const beat = 60 / bpm, tick = beat / 12;
  let t = at;
  if (countIn) { for (let i = 0; i < 4; i++) DRUMS.click(ctx, t + i * beat, i === 0); t += 4 * beat; }
  if (pulse) for (let i = 0; i < 4; i++) DRUMS.click(ctx, t + i * beat, i === 0);
  const times = onsets(rh).map((o) => t + o * tick);
  times.forEach((x) => DRUMS.block(ctx, x));
  return { barStart: t, times, end: t + BAR * tick };
}

// ── Notation (SVG) ────────────────────────────────────────────────────────────

function RhythmNotation({ rhythm, compact = false }: { rhythm: Rhythm; compact?: boolean }) {
  const W = 320, H = compact ? 58 : 70, y = H - 24, x0 = 18, span = 284;
  const xs: number[] = [];
  let acc = 0;
  for (const e of rhythm) { xs.push(x0 + (acc / BAR) * span); acc += e.ticks; }
  const items: React.ReactNode[] = [];
  rhythm.forEach((e, i) => {
    const x = xs[i];
    const base = e.tuplet ? e.ticks * 1.5 : e.ticks; // a triplet eighth looks like an eighth
    const dotted = !e.tuplet && (e.ticks === 18 || e.ticks === 9);
    if (e.rest) {
      if (base >= 24) items.push(<rect key={i} x={x} y={y - 4} width={10} height={4} fill="#111" />);
      else if (base >= 12) items.push(<path key={i} d={`M${x + 3},${y - 14} l5,6 l-5,5 l5,6 q-6,-2 -3,4`} stroke="#111" strokeWidth={2} fill="none" />);
      else {
        const flags = base >= 6 ? 1 : 2;
        items.push(
          <g key={i} stroke="#111" strokeWidth={1.6} fill="#111">
            <line x1={x + 9} y1={y - 12} x2={x + 4} y2={y + 2} />
            {Array.from({ length: flags }, (_, k) => <circle key={k} cx={x + 5 - k * 1.5} cy={y - 9 + k * 5} r={2} />)}
          </g>
        );
      }
    } else {
      const hollow = base >= 24;
      const flags = base >= 12 ? 0 : base >= 6 ? 1 : 2;
      items.push(
        <g key={i}>
          <ellipse cx={x + 5} cy={y} rx={5} ry={3.6} transform={`rotate(-20 ${x + 5} ${y})`} fill={hollow ? "#fff" : "#111"} stroke="#111" strokeWidth={1.4} />
          <line x1={x + 9.6} y1={y - 1} x2={x + 9.6} y2={y - 26} stroke="#111" strokeWidth={1.4} />
          {Array.from({ length: flags }, (_, k) => (
            <path key={k} d={`M${x + 9.6},${y - 26 + k * 6} q7,5 5,13`} stroke="#111" strokeWidth={1.6} fill="none" />
          ))}
          {dotted && <circle cx={x + 15} cy={y - 1} r={1.7} fill="#111" />}
        </g>
      );
    }
  });
  // "3" over each triplet group (they always fill one beat)
  const groups: { a: number; b: number }[] = [];
  acc = 0;
  rhythm.forEach((e, i) => {
    if (e.tuplet && acc % 12 === 0) groups.push({ a: xs[i], b: x0 + ((acc + 12) / BAR) * span - 6 });
    acc += e.ticks;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 360 }} role="img" aria-label="Rhythm notation">
      <line x1={10} x2={W - 10} y1={y} y2={y} stroke="#9ca3af" />
      <line x1={10} x2={10} y1={y - 10} y2={y + 10} stroke="#6b7280" strokeWidth={1.5} />
      <line x1={W - 10} x2={W - 10} y1={y - 10} y2={y + 10} stroke="#6b7280" strokeWidth={1.5} />
      {groups.map((g, k) => (
        <g key={k} stroke="#6b7280" fill="#6b7280">
          <polyline points={`${g.a},${y - 30} ${g.a},${y - 34} ${g.b},${y - 34} ${g.b},${y - 30}`} fill="none" />
          <text x={(g.a + g.b) / 2} y={y - 37} fontSize={10} textAnchor="middle" stroke="none">3</text>
        </g>
      ))}
      {items}
    </svg>
  );
}

// ── Tap scoring ───────────────────────────────────────────────────────────────

type Hit = { exp: number; tap: number | null; err: number | null };
function scoreTaps(expected: number[], taps: number[], windows = [0.035, 0.07, 0.12, 0.2]) {
  const used = new Set<number>();
  const hits: Hit[] = expected.map((exp) => {
    let best = -1, bestErr = Infinity;
    taps.forEach((tp, i) => { const e = Math.abs(tp - exp); if (!used.has(i) && e < bestErr) { best = i; bestErr = e; } });
    if (best >= 0 && bestErr <= windows[3]) { used.add(best); return { exp, tap: taps[best], err: taps[best] - exp }; }
    return { exp, tap: null, err: null };
  });
  const pts = hits.map((h) => (h.err === null ? 0 : Math.abs(h.err) <= windows[0] ? 100 : Math.abs(h.err) <= windows[1] ? 80 : Math.abs(h.err) <= windows[2] ? 50 : 25));
  const extra = taps.length - used.size;
  const score = Math.max(0, Math.round(pts.reduce((a, b) => a + b, 0) / Math.max(1, expected.length) - extra * 5));
  const errs = hits.filter((h) => h.err !== null).map((h) => h.err as number);
  const meanErr = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 0;
  return { hits, extra, score, meanErr, extraTaps: taps.filter((_, i) => !used.has(i)) };
}

function TapTimeline({ start, end, hits, extraTaps, beats = [] }: { start: number; end: number; hits: Hit[]; extraTaps: number[]; beats?: number[] }) {
  const W = 320, H = 46, X = (t: number) => 10 + ((t - start) / (end - start)) * (W - 20);
  const col = (e: number) => (Math.abs(e) <= 0.035 ? "#16a34a" : Math.abs(e) <= 0.07 ? "#65a30d" : Math.abs(e) <= 0.12 ? "#d97706" : "#dc2626");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 420 }}>
      <line x1={10} x2={W - 10} y1={24} y2={24} stroke="#e5e7eb" strokeWidth={2} />
      {beats.map((b, i) => <line key={`b${i}`} x1={X(b)} x2={X(b)} y1={18} y2={30} stroke="#d1d5db" />)}
      {hits.map((h, i) => <line key={`e${i}`} x1={X(h.exp)} x2={X(h.exp)} y1={10} y2={38} stroke="#111" strokeWidth={1.5} />)}
      {hits.map((h, i) => h.tap !== null && <circle key={`t${i}`} cx={X(h.tap)} cy={24} r={5} fill={col(h.err!)} />)}
      {hits.map((h, i) => h.tap === null && <text key={`m${i}`} x={X(h.exp)} y={9} fontSize={9} textAnchor="middle" fill="#dc2626">miss</text>)}
      {extraTaps.map((x, i) => <text key={`x${i}`} x={X(x)} y={28} fontSize={11} textAnchor="middle" fill="#9ca3af">×</text>)}
    </svg>
  );
}
const timingWord = (meanErr: number, hits?: Hit[]) =>
  hits && !hits.some((h) => h.err !== null) ? "No taps landed on the rhythm." : Math.abs(meanErr) < 0.012 ? "Right in the pocket." : meanErr < 0 ? `You were ${Math.round(-meanErr * 1000)} ms early on average (rushing).` : `You were ${Math.round(meanErr * 1000)} ms late on average (dragging).`;

// Tap input: a big pad plus the spacebar (or two keys for two lanes)
function useTaps(getCtx: () => AudioContext, active: boolean, keys: string[] = [" "]) {
  const [taps, setTaps] = useState<number[][]>(keys.map(() => []));
  const tapsRef = useRef<number[][]>(keys.map(() => []));
  const reset = () => { tapsRef.current = keys.map(() => []); setTaps(tapsRef.current); };
  const tap = (lane = 0) => {
    if (!active) return;
    const c = getCtx();
    const t = c.currentTime - latency(c);
    tapsRef.current = tapsRef.current.map((l, i) => (i === lane ? [...l, t] : l));
    setTaps(tapsRef.current);
  };
  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const lane = keys.indexOf(e.key.toLowerCase() === " " ? " " : e.key.toLowerCase());
      if (lane < 0 || e.repeat) return;
      e.preventDefault();
      tap(lane);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });
  return { taps, tapsRef, tap, reset };
}

function TapPad({ onTap, label = "TAP", sub = "or press Space", disabled = false }: { onTap: () => void; label?: string; sub?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => { e.preventDefault(); onTap(); }}
      className={`w-full max-w-xs mx-auto h-32 rounded-2xl border-2 text-2xl font-black tracking-widest select-none touch-none transition-all ${disabled ? "border-gray-200 bg-gray-50 text-gray-300" : "border-blue-500 bg-blue-50 text-blue-700 active:scale-95 active:bg-blue-100"}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {label}
      <div className="text-xs font-medium tracking-normal opacity-70 mt-1">{sub}</div>
    </button>
  );
}

type GameProps = { onExit: () => void; getCtx: () => AudioContext };

// ── 1. Rhythm Dictation ───────────────────────────────────────────────────────

function RhythmDictation({ onExit, getCtx }: GameProps) {
  const ROUNDS = 10;
  const s = useSession(ROUNDS);
  const [level, setLevel] = useState(1);
  const [q, setQ] = useState<{ answer: string; options: Record<string, Rhythm> } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const bpm = 80;
  const next = (lvl = level) => {
    const options: Record<string, Rhythm> = {};
    while (Object.keys(options).length < 4) { const { rhythm } = makeRhythm(lvl); options[rhythmKey(rhythm)] = rhythm; }
    const answer = pick(Object.keys(options));
    setQ({ answer, options }); setSel(null);
    playRhythm(getCtx(), options[answer], bpm);
  };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (s.finished) return <SessionDone title="Rhythm Dictation" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Rhythm Dictation" round={s.round + (sel ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Difficulty" options={LEVELS} value={level} onChange={(l) => { setLevel(l); next(l); }} disabled={sel !== null} />
      <p className="text-center text-gray-500 text-sm mb-3">After four count-in clicks, which rhythm do you hear?</p>
      <div className="text-center mb-5">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => q && playRhythm(getCtx(), q.options[q.answer], bpm)}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button>
      </div>
      {q && <ChoiceGrid choices={Object.keys(q.options)} answer={q.answer} selected={sel}
        onPick={(c) => { setSel(c); s.add(c === q.answer ? 100 : 0); }}
        render={(c) => <RhythmNotation rhythm={q.options[c]} compact />} />}
      {sel && q && <NextLine ok={sel === q.answer} wrong="Not quite — the highlighted one was played." onNext={() => next()} label="Next Rhythm" s={s} />}
    </GameCard>
  );
}

// ── 2. Time Signature Detective ───────────────────────────────────────────────

const METERS: Record<string, { level: number; pulses: number; eighth: boolean; groups: number[] }> = {
  "2/4": { level: 1, pulses: 2, eighth: false, groups: [1, 1] },
  "3/4": { level: 1, pulses: 3, eighth: false, groups: [1, 1, 1] },
  "4/4": { level: 1, pulses: 4, eighth: false, groups: [1, 1, 1, 1] },
  "6/8": { level: 1, pulses: 6, eighth: true, groups: [3, 3] },
  "5/4": { level: 2, pulses: 5, eighth: false, groups: [1, 1, 1, 1, 1] },
  "7/8": { level: 2, pulses: 7, eighth: true, groups: [2, 2, 3] },
};
function playMeter(ctx: AudioContext, name: string, bpm: number) {
  const m = METERS[name];
  const step = (60 / bpm) / (m.eighth ? 2 : 1);
  const at = ctx.currentTime + 0.12;
  for (let bar = 0; bar < 4; bar++) {
    let p = 0;
    m.groups.forEach((g, gi) => {
      for (let k = 0; k < g; k++, p++) {
        const t = at + (bar * m.pulses + p) * step;
        if (p === 0) { DRUMS.kick(ctx, t); DRUMS.openHat(ctx, t, 0.12); }
        else if (k === 0 && gi > 0) { DRUMS.rim(ctx, t, 0.5); DRUMS.hat(ctx, t, 0.2); }
        else DRUMS.hat(ctx, t, 0.14);
      }
    });
  }
}
function TimeSignature({ onExit, getCtx }: GameProps) {
  const ROUNDS = 10;
  const s = useSession(ROUNDS);
  const [level, setLevel] = useState(1);
  const [q, setQ] = useState<{ answer: string; choices: string[]; bpm: number } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const next = (lvl = level) => {
    const pool = Object.keys(METERS).filter((k) => METERS[k].level <= lvl);
    const answer = pick(pool);
    const choices = shuffle([answer, ...shuffle(pool.filter((k) => k !== answer)).slice(0, 3)]);
    const bpm = 84 + Math.floor(Math.random() * 30);
    setQ({ answer, choices, bpm }); setSel(null);
    playMeter(getCtx(), answer, bpm);
  };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (s.finished) return <SessionDone title="Time Signature Detective" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Time Signature Detective" round={s.round + (sel ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Difficulty" options={[{ id: 1, label: "Common" }, { id: 2, label: "+ Odd meters" }]} value={level} onChange={(l) => { setLevel(l); next(l); }} disabled={sel !== null} />
      <p className="text-center text-gray-500 text-sm mb-3">Listen for the strong downbeat. What&apos;s the time signature?</p>
      <div className="text-center mb-5"><button type="button" className="btn btn-outline btn-sm" onClick={() => q && playMeter(getCtx(), q.answer, q.bpm)}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button></div>
      {q && <ChoiceGrid choices={q.choices} answer={q.answer} selected={sel} onPick={(c) => { setSel(c); s.add(c === q.answer ? 100 : 0); }} />}
      {sel && q && <NextLine ok={sel === q.answer} wrong={`Not quite — it was ${q.answer}`} onNext={() => next()} label="Next Loop" s={s} />}
    </GameCard>
  );
}

// ── 3. Groove ID ──────────────────────────────────────────────────────────────

// 16-step grids (sixteenths of one 4/4 bar); "clave" patterns span two bars.
type Groove = { bpm: number; steps: number; parts: Partial<Record<DrumName, number[]>> };
const GROOVES: Record<string, Groove> = {
  Dembow: { bpm: 95, steps: 16, parts: { kick: [0, 4, 8, 12], snare: [3, 6, 11, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  Trap: { bpm: 140, steps: 32, parts: { kick: [0, 7, 10, 16, 22, 26], snare: [8, 24], hat: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 29, 30, 31] } },
  "Boom Bap": { bpm: 90, steps: 16, parts: { kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  "Four-on-the-Floor": { bpm: 124, steps: 16, parts: { kick: [0, 4, 8, 12], clap: [4, 12], openHat: [2, 6, 10, 14] } },
  "Dancehall (One Drop)": { bpm: 85, steps: 16, parts: { kick: [8], rim: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  Afrobeats: { bpm: 105, steps: 16, parts: { kick: [0, 7, 10], rim: [3, 6, 10, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  "Son Clave (3-2)": { bpm: 100, steps: 32, parts: { clave: [0, 6, 12, 20, 24], hat: [0, 4, 8, 12, 16, 20, 24, 28] } },
};
function playGroove(ctx: AudioContext, g: Groove, loops = 2, at = ctx.currentTime + 0.12) {
  const step = 60 / g.bpm / 4;
  for (let l = 0; l < loops; l++) {
    (Object.keys(g.parts) as DrumName[]).forEach((d) => g.parts[d]!.forEach((s) => (DRUMS[d] as any)(ctx, at + (l * g.steps + s) * step)));
  }
  return at + loops * g.steps * step;
}
function GrooveId({ onExit, getCtx }: GameProps) {
  const ROUNDS = 10;
  const s = useSession(ROUNDS);
  const [q, setQ] = useState<{ answer: string; choices: string[] } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const next = () => {
    const names = Object.keys(GROOVES);
    const answer = pick(names);
    setQ({ answer, choices: shuffle([answer, ...shuffle(names.filter((k) => k !== answer)).slice(0, 3)]) }); setSel(null);
    const g = GROOVES[answer];
    playGroove(getCtx(), g, g.steps === 32 ? 2 : 4);
  };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (s.finished) return <SessionDone title="Groove ID" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Groove ID" round={s.round + (sel ? 0 : 1)} rounds={ROUNDS}>
      <p className="text-center text-gray-500 text-sm mb-3">Which groove is this?</p>
      <div className="text-center mb-5"><button type="button" className="btn btn-outline btn-sm" onClick={() => { if (q) { const g = GROOVES[q.answer]; playGroove(getCtx(), g, g.steps === 32 ? 2 : 4); } }}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button></div>
      {q && <ChoiceGrid choices={q.choices} answer={q.answer} selected={sel} onPick={(c) => { setSel(c); s.add(c === q.answer ? 100 : 0); }} />}
      {sel && q && <NextLine ok={sel === q.answer} wrong={`Not quite — that was ${q.answer}`} onNext={next} label="Next Groove" s={s} />}
    </GameCard>
  );
}

// ── 4. Tempo Guess ────────────────────────────────────────────────────────────

function TempoGuess({ onExit, getCtx }: GameProps) {
  const ROUNDS = 10;
  const s = useSession(ROUNDS);
  const [bpm, setBpm] = useState(0);
  const [guess, setGuess] = useState(110);
  const [result, setResult] = useState<number | null>(null);
  const tapTimes = useRef<number[]>([]);
  const play = (b: number) => {
    const g: Groove = { bpm: b, steps: 16, parts: { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] } };
    playGroove(getCtx(), g, 4);
  };
  const next = () => { const b = 60 + Math.floor(Math.random() * 121); setBpm(b); setResult(null); tapTimes.current = []; play(b); };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    const err = Math.abs(guess - bpm);
    const pts = err <= 2 ? 100 : err <= 5 ? 80 : err <= 10 ? 50 : err <= 20 ? 20 : 0;
    setResult(pts); s.add(pts);
  };
  const tapTempo = () => {
    const now = performance.now();
    tapTimes.current = [...tapTimes.current.filter((t) => now - t < 3000), now];
    const t = tapTimes.current;
    if (t.length >= 2) setGuess(Math.round(60000 / ((t[t.length - 1] - t[0]) / (t.length - 1))));
  };
  if (s.finished) return <SessionDone title="Tempo Guess" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Tempo Guess" round={s.round + (result === null ? 1 : 0)} rounds={ROUNDS}>
      <p className="text-center text-gray-500 text-sm mb-3">How fast is this beat? Within 2 BPM is a perfect score.</p>
      <div className="text-center mb-5"><button type="button" className="btn btn-outline btn-sm" onClick={() => play(bpm)}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button></div>
      <div className="max-w-sm mx-auto">
        <div className="text-center text-5xl font-black text-gray-900 mb-2">{guess}<span className="text-lg font-semibold text-gray-400 ml-1">BPM</span></div>
        <input type="range" min={50} max={200} value={guess} disabled={result !== null} onChange={(e) => setGuess(Number(e.target.value))} className="range range-primary range-sm mb-4" />
        <div className="flex justify-center gap-3 mb-4">
          <button type="button" className="btn btn-outline btn-sm" disabled={result !== null} onClick={tapTempo}>Tap tempo</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={result !== null} onClick={submit}>Submit</button>
        </div>
      </div>
      {result !== null && (
        <div className="text-center">
          <p className="font-bold mb-1" style={{ color: accColor(result) }}>{result}% — it was {bpm} BPM (you were {Math.abs(guess - bpm)} off)</p>
          <button type="button" onClick={s.done ? s.finish : next} className="btn btn-primary btn-sm mt-2">{s.done ? "See Results" : "Next Beat"}</button>
        </div>
      )}
    </GameCard>
  );
}

// ── 5. Spot the Change ────────────────────────────────────────────────────────

function SpotTheChange({ onExit, getCtx }: GameProps) {
  const ROUNDS = 10;
  const s = useSession(ROUNDS);
  const [level, setLevel] = useState(2);
  const [q, setQ] = useState<{ a: Rhythm; b: Rhythm; answer: string } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const bpm = 90;
  const play = (a: Rhythm, b: Rhythm) => {
    const c = getCtx();
    const first = playRhythm(c, a, bpm);
    playRhythm(c, b, bpm, { countIn: false, at: first.end + 60 / bpm });
  };
  const next = (lvl = level) => {
    const { beats } = makeRhythm(lvl, true);
    const a = beats.flat();
    let answer = "Same", b = a;
    if (Math.random() > 0.3) {
      const k = Math.floor(Math.random() * 4);
      const alt = shuffle(PATTERNS.filter((p) => p.beats === 1 && p.level <= lvl && rhythmKey(p.evs) !== rhythmKey(beats[k])))[0];
      const nb = beats.map((x, i) => (i === k ? alt.evs : x));
      if (nb.flat().some((e) => !e.rest)) { b = nb.flat(); answer = `Beat ${k + 1}`; }
    }
    setQ({ a, b, answer }); setSel(null); play(a, b);
  };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (s.finished) return <SessionDone title="Spot the Change" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Spot the Change" round={s.round + (sel ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Difficulty" options={LEVELS.slice(0, 3)} value={level} onChange={(l) => { setLevel(l); next(l); }} disabled={sel !== null} />
      <p className="text-center text-gray-500 text-sm mb-3">Two bars play. Are they the same, or which beat changed?</p>
      <div className="text-center mb-5"><button type="button" className="btn btn-outline btn-sm" onClick={() => q && play(q.a, q.b)}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button></div>
      {q && <ChoiceGrid choices={["Same", "Beat 1", "Beat 2", "Beat 3", "Beat 4"]} answer={q.answer} selected={sel} onPick={(c) => { setSel(c); s.add(c === q.answer ? 100 : 0); }} />}
      {sel && q && (
        <>
          <div className="flex flex-col items-center gap-1 mb-3 text-xs text-gray-400">
            <span>First bar</span><RhythmNotation rhythm={q.a} compact />
            <span>Second bar</span><RhythmNotation rhythm={q.b} compact />
          </div>
          <NextLine ok={sel === q.answer} wrong={`Not quite — ${q.answer === "Same" ? "they were the same" : `${q.answer} changed`}`} onNext={() => next()} label="Next Pair" s={s} />
        </>
      )}
    </GameCard>
  );
}

// ── 6. Tap It Back ────────────────────────────────────────────────────────────

function TapItBack({ onExit, getCtx }: GameProps) {
  const ROUNDS = 5;
  const s = useSession(ROUNDS);
  const [level, setLevel] = useState(1);
  const [rhythm, setRhythm] = useState<Rhythm>(() => makeRhythm(1).rhythm);
  const [phase, setPhase] = useState<"idle" | "listen" | "tap" | "result">("idle");
  const [window_, setWindow] = useState<{ start: number; end: number; expected: number[]; beats: number[] } | null>(null);
  const [res, setRes] = useState<ReturnType<typeof scoreTaps> | null>(null);
  const { tap, reset, tapsRef } = useTaps(getCtx, phase === "tap");
  const bpm = 80;
  const run = async (rh = rhythm) => {
    const c = getCtx();
    setPhase("listen"); setRes(null); reset();
    const demo = playRhythm(c, rh, bpm);
    await sleep((demo.end - c.currentTime) * 1000 + 300);
    // count-in, then the player taps the bar (no woodblock this time, just the pulse)
    const beat = 60 / bpm;
    const at = c.currentTime + 0.1;
    for (let i = 0; i < 4; i++) DRUMS.click(c, at + i * beat, i === 0);
    const start = at + 4 * beat;
    for (let i = 0; i < 4; i++) DRUMS.click(c, start + i * beat, i === 0);
    const tick = beat / 12;
    setWindow({ start, end: start + BAR * tick, expected: onsets(rh).map((o) => start + o * tick), beats: [0, 1, 2, 3].map((i) => start + i * beat) });
    setPhase("tap");
    await sleep((start + BAR * tick - c.currentTime) * 1000 + 450);
    setPhase("result");
  };
  useEffect(() => {
    if (phase !== "result" || !window_) return;
    const r = scoreTaps(window_.expected, tapsRef.current[0].filter((t) => t > window_.start - 0.25 && t < window_.end + 0.25));
    setRes(r); s.add(r.score);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = (lvl = level) => { const rh = makeRhythm(lvl).rhythm; setRhythm(rh); setPhase("idle"); setRes(null); };
  if (s.finished) return <SessionDone title="Tap It Back" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Tap It Back" round={s.round + (phase === "result" ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Difficulty" options={LEVELS} value={level} onChange={(l) => { setLevel(l); next(l); }} disabled={phase !== "idle"} />
      <div className="flex justify-center mb-4"><RhythmNotation rhythm={rhythm} /></div>
      <p className="text-center text-gray-500 text-sm mb-4">
        {phase === "idle" && "Listen to the rhythm, then after the count-in tap it back on the pad or Space."}
        {phase === "listen" && "Listen…"}
        {phase === "tap" && "Your turn — tap it!"}
        {phase === "result" && res && <span className="font-bold text-lg" style={{ color: accColor(res.score) }}>{res.score}% · {timingWord(res.meanErr, res.hits)}</span>}
      </p>
      {phase === "result" && res && window_ && <div className="flex justify-center mb-4"><TapTimeline start={window_.start} end={window_.end} hits={res.hits} extraTaps={res.extraTaps} beats={window_.beats} /></div>}
      {(phase === "tap" || phase === "listen") && <div className="flex justify-center mb-4"><TapPad onTap={() => tap(0)} disabled={phase !== "tap"} /></div>}
      <div className="flex justify-center gap-3">
        {phase === "idle" && <button type="button" className="btn btn-primary" onClick={() => run()}><FontAwesomeIcon icon={faPlay} className="mr-1.5" /> Start</button>}
        {phase === "result" && <>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => run()}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Try Again</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => (s.done ? s.finish() : next())}>{s.done ? "See Results" : "Next Rhythm"}</button>
        </>}
      </div>
    </GameCard>
  );
}

// ── 7. Steady Pulse / 8. Off-Beat Challenge (shared tap-along engine) ─────────

function TapAlong({ title, onExit, getCtx, mode }: GameProps & { title: string; mode: "pulse" | "offbeat" }) {
  const ROUNDS = 5;
  const s = useSession(ROUNDS);
  const [bpm, setBpm] = useState(90);
  const [variant, setVariant] = useState<"ands" | "backbeat">("ands");
  const [phase, setPhase] = useState<"idle" | "play" | "result">("idle");
  const [res, setRes] = useState<(ReturnType<typeof scoreTaps> & { start: number; end: number; beats: number[] }) | null>(null);
  const { tap, reset, tapsRef } = useTaps(getCtx, phase === "play");
  const run = async () => {
    const c = getCtx();
    reset(); setRes(null); setPhase("play");
    const beat = 60 / bpm, at = c.currentTime + 0.12;
    let expected: number[] = [], start: number, end: number;
    if (mode === "pulse") {
      // 2 bars with the click, then 2 silent bars: keep tapping the beat
      for (let i = 0; i < 8; i++) DRUMS.click(c, at + i * beat, i % 4 === 0);
      start = at + 8 * beat; end = start + 8 * beat;
      expected = Array.from({ length: 8 }, (_, i) => start + i * beat);
    } else {
      // 1-bar count-in, then 3 bars of click: tap the off-beats or 2 & 4
      for (let i = 0; i < 16; i++) DRUMS.click(c, at + i * beat, i % 4 === 0);
      start = at + 4 * beat; end = start + 12 * beat;
      for (let i = 0; i < 12; i++) {
        const t = start + i * beat;
        if (variant === "ands") expected.push(t + beat / 2);
        else if (i % 4 === 1 || i % 4 === 3) expected.push(t);
      }
    }
    await sleep((end - c.currentTime) * 1000 + 400);
    const taps = tapsRef.current[0].filter((t) => t > start - 0.3 && t < end + 0.2);
    const r = scoreTaps(expected, taps, mode === "pulse" ? [0.03, 0.06, 0.1, 0.16] : undefined);
    const beats = Array.from({ length: Math.round((end - start) / beat) }, (_, i) => start + i * beat);
    setRes({ ...r, start, end, beats }); s.add(r.score); setPhase("result");
  };
  if (s.finished) return <SessionDone title={title} score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); setPhase("idle"); }} onExit={onExit} />;
  const prompt = mode === "pulse"
    ? "Tap along with the click. After two bars it goes silent — keep the same steady beat for two more bars."
    : variant === "ands" ? "After the count-in bar, tap only the off-beats (the “and” between each click)." : "After the count-in bar, tap only beats 2 and 4 (the backbeat).";
  return (
    <GameCard title={title} round={s.round + (phase === "result" ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Tempo" options={[70, 90, 110, 130].map((b) => ({ id: b, label: `${b} BPM` }))} value={bpm} onChange={(v) => setBpm(Number(v))} disabled={phase === "play"} />
      {mode === "offbeat" && <Pills label="Target" options={[{ id: "ands" as const, label: "Off-beats (&)" }, { id: "backbeat" as const, label: "Backbeat (2 & 4)" }]} value={variant} onChange={(v) => setVariant(v as "ands" | "backbeat")} disabled={phase === "play"} />}
      <p className="text-center text-gray-500 text-sm mb-4">{phase === "result" && res ? <span className="font-bold text-lg" style={{ color: accColor(res.score) }}>{res.score}% · {timingWord(res.meanErr, res.hits)}</span> : prompt}</p>
      {phase === "result" && res && <div className="flex justify-center mb-4"><TapTimeline start={res.start} end={res.end} hits={res.hits} extraTaps={res.extraTaps} beats={res.beats} /></div>}
      {phase === "play" && <div className="flex justify-center mb-4"><TapPad onTap={() => tap(0)} /></div>}
      <div className="flex justify-center gap-3">
        {phase === "idle" && <button type="button" className="btn btn-primary" onClick={run}><FontAwesomeIcon icon={faPlay} className="mr-1.5" /> Start</button>}
        {phase === "result" && <button type="button" className="btn btn-primary btn-sm" onClick={() => (s.done ? s.finish() : setPhase("idle"))}>{s.done ? "See Results" : "Next Round"}</button>}
      </div>
    </GameCard>
  );
}

// ── 9. Polyrhythm Trainer ─────────────────────────────────────────────────────

const POLYS = { "3:2": [3, 2], "4:3": [4, 3], "5:4": [5, 4] } as const;
function Polyrhythm({ onExit, getCtx }: GameProps) {
  const ROUNDS = 5;
  const s = useSession(ROUNDS);
  const [poly, setPoly] = useState<keyof typeof POLYS>("3:2");
  const [phase, setPhase] = useState<"idle" | "listen" | "play" | "result">("idle");
  const [res, setRes] = useState<{ left: ReturnType<typeof scoreTaps>; right: ReturnType<typeof scoreTaps>; start: number; end: number } | null>(null);
  const { tap, reset, tapsRef } = useTaps(getCtx, phase === "play", ["f", "j"]);
  const CYCLE = 2; // seconds per cycle
  const run = async () => {
    const c = getCtx();
    reset(); setRes(null); setPhase("listen");
    const [a, b] = POLYS[poly];
    const at = c.currentTime + 0.15;
    const lane = (k: number, cycles: number, from: number) => Array.from({ length: k * cycles }, (_, i) => from + (i * CYCLE) / k);
    // two demo cycles with both hands, then two cycles where only the downbeat sounds
    lane(a, 2, at).forEach((t) => DRUMS.low(c, t));
    lane(b, 2, at).forEach((t) => DRUMS.block(c, t));
    const start = at + 2 * CYCLE;
    [0, 1].forEach((i) => DRUMS.click(c, start + i * CYCLE, true));
    setTimeout(() => setPhase("play"), (start - c.currentTime - 0.3) * 1000);
    const end = start + 2 * CYCLE;
    await sleep((end - c.currentTime) * 1000 + 400);
    const inWin = (l: number[]) => l.filter((t) => t > start - 0.25 && t < end);
    const left = scoreTaps(lane(a, 2, start), inWin(tapsRef.current[0]));
    const right = scoreTaps(lane(b, 2, start), inWin(tapsRef.current[1]));
    setRes({ left, right, start, end }); s.add(Math.round((left.score + right.score) / 2)); setPhase("result");
  };
  if (s.finished) return <SessionDone title="Polyrhythm Trainer" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); setPhase("idle"); }} onExit={onExit} />;
  const [a, b] = POLYS[poly];
  return (
    <GameCard title="Polyrhythm Trainer" round={s.round + (phase === "result" ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Ratio" options={(Object.keys(POLYS) as (keyof typeof POLYS)[]).map((k) => ({ id: k, label: k }))} value={poly} onChange={(v) => setPoly(v as keyof typeof POLYS)} disabled={phase !== "idle" && phase !== "result"} />
      <p className="text-center text-gray-500 text-sm mb-4">
        {phase === "result" && res
          ? <span className="font-bold text-lg" style={{ color: accColor(Math.round((res.left.score + res.right.score) / 2)) }}>Left {res.left.score}% · Right {res.right.score}%</span>
          : `Listen to two cycles: ${a} low notes against ${b} high notes. Then keep both going for two cycles — left hand on the left pad (F), right hand on the right pad (J).`}
      </p>
      {phase === "result" && res && (
        <div className="flex flex-col items-center gap-1 mb-4 text-xs text-gray-400">
          <span>Left ({a})</span><TapTimeline start={res.start} end={res.end} hits={res.left.hits} extraTaps={res.left.extraTaps} />
          <span>Right ({b})</span><TapTimeline start={res.start} end={res.end} hits={res.right.hits} extraTaps={res.right.extraTaps} />
        </div>
      )}
      {(phase === "listen" || phase === "play") && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <TapPad onTap={() => tap(0)} label={`${a}`} sub="left · F" disabled={phase !== "play"} />
          <TapPad onTap={() => tap(1)} label={`${b}`} sub="right · J" disabled={phase !== "play"} />
        </div>
      )}
      <div className="flex justify-center gap-3">
        {phase === "idle" && <button type="button" className="btn btn-primary" onClick={run}><FontAwesomeIcon icon={faPlay} className="mr-1.5" /> Start</button>}
        {phase === "result" && <button type="button" className="btn btn-primary btn-sm" onClick={() => (s.done ? s.finish() : setPhase("idle"))}>{s.done ? "See Results" : "Next Round"}</button>}
      </div>
    </GameCard>
  );
}

// ── 10. Rebuild the Beat ──────────────────────────────────────────────────────

const LANES: { id: "kick" | "snare" | "hat"; label: string }[] = [{ id: "hat", label: "Hi-hat" }, { id: "snare", label: "Snare" }, { id: "kick", label: "Kick" }];
type Grid = Record<"kick" | "snare" | "hat", boolean[]>;
const emptyGrid = (): Grid => ({ kick: Array(16).fill(false), snare: Array(16).fill(false), hat: Array(16).fill(false) });
function makeBeat(level: number): Grid {
  const g = emptyGrid();
  g.kick[0] = true;
  const kicks = level === 1 ? [8] : level === 2 ? [8, 10] : shuffle([6, 7, 8, 10, 11, 14]).slice(0, 2 + Math.floor(Math.random() * 2));
  kicks.forEach((k) => (g.kick[k] = true));
  (level === 3 && Math.random() < 0.5 ? [4, 12, 15] : [4, 12]).forEach((k) => (g.snare[k] = true));
  const hats = level === 1 ? [0, 4, 8, 12] : level === 2 ? [0, 2, 4, 6, 8, 10, 12, 14] : Array.from({ length: 16 }, (_, i) => i).filter((i) => i % 2 === 0 || Math.random() < 0.35);
  hats.forEach((k) => (g.hat[k] = true));
  return g;
}
function playGrid(ctx: AudioContext, g: Grid, bpm: number, loops = 2) {
  const step = 60 / bpm / 4, at = ctx.currentTime + 0.12;
  for (let l = 0; l < loops; l++) LANES.forEach(({ id }) => g[id].forEach((on, i) => on && DRUMS[id](ctx, at + (l * 16 + i) * step)));
}
function RebuildBeat({ onExit, getCtx }: GameProps) {
  const ROUNDS = 5;
  const s = useSession(ROUNDS);
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState<Grid>(() => makeBeat(1));
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [result, setResult] = useState<number | null>(null);
  const bpm = 95;
  const next = (lvl = level) => { const t = makeBeat(lvl); setTarget(t); setGrid(emptyGrid()); setResult(null); playGrid(getCtx(), t, bpm); };
  const submit = () => {
    let tp = 0, fp = 0, fn = 0;
    LANES.forEach(({ id }) => grid[id].forEach((on, i) => { if (on && target[id][i]) tp++; else if (on) fp++; else if (target[id][i]) fn++; }));
    const pts = Math.round((2 * tp) / Math.max(1, 2 * tp + fp + fn) * 100);
    setResult(pts); s.add(pts);
  };
  if (s.finished) return <SessionDone title="Rebuild the Beat" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Rebuild the Beat" round={s.round + (result === null ? 1 : 0)} rounds={ROUNDS}>
      <Pills label="Difficulty" options={LEVELS.slice(0, 3)} value={level} onChange={(l) => { setLevel(l); next(l); }} disabled={result !== null} />
      <p className="text-center text-gray-500 text-sm mb-4">Recreate the drum loop on the grid. Play yours against the original as often as you like.</p>
      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => playGrid(getCtx(), target, bpm)}>▶ Original</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => playGrid(getCtx(), grid, bpm)}>▶ Mine</button>
      </div>
      <div className="overflow-x-auto mb-4">
        <div className="min-w-[520px]">
          {LANES.map(({ id, label }) => (
            <div key={id} className="flex items-center gap-1 mb-1">
              <span className="w-14 text-xs font-semibold text-gray-500">{label}</span>
              {grid[id].map((on, i) => {
                const show = result !== null;
                const want = target[id][i];
                const bg = show ? (on && want ? "#16a34a" : on ? "#dc2626" : want ? "#fde68a" : i % 4 === 0 ? "#e5e7eb" : "#f3f4f6") : on ? "#2563eb" : i % 4 === 0 ? "#e5e7eb" : "#f3f4f6";
                return (
                  <button key={i} type="button" disabled={show} aria-label={`${label} step ${i + 1}`}
                    onClick={() => setGrid((g) => ({ ...g, [id]: g[id].map((x, k) => (k === i ? !x : x)) }))}
                    className="flex-1 h-8 rounded" style={{ background: bg, marginLeft: i % 4 === 0 && i ? 4 : 0 }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {result === null
        ? <div className="text-center"><button type="button" className="btn btn-primary btn-sm" onClick={submit}>Check My Beat</button></div>
        : (
          <div className="text-center">
            <p className="font-bold mb-1" style={{ color: accColor(result) }}>{result}% match</p>
            <p className="text-xs text-gray-400 mb-3">Green: right · Red: extra · Yellow: missed</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => (s.done ? s.finish() : next())}>{s.done ? "See Results" : "Next Beat"}</button>
          </div>
        )}
    </GameCard>
  );
}

// ── 11. Hi-Hat Roll ID ────────────────────────────────────────────────────────

const ROLLS: Record<string, number> = { "1/16": 4, "1/16 triplet": 6, "1/32": 8, "1/32 triplet": 12, "1/64": 16 };
function playRoll(ctx: AudioContext, hitsInLastBeat: number) {
  const bpm = 140, beat = 60 / bpm, at = ctx.currentTime + 0.12;
  for (let bar = 0; bar < 2; bar++) {
    const b0 = at + bar * 4 * beat;
    DRUMS.kick(ctx, b0); DRUMS.kick(ctx, b0 + 2.75 * beat); DRUMS.snare(ctx, b0 + 2 * beat);
    for (let i = 0; i < 6; i++) DRUMS.hat(ctx, b0 + i * beat / 2);
    // the roll fills beat 4
    for (let i = 0; i < hitsInLastBeat; i++) DRUMS.hat(ctx, b0 + 3 * beat + (i * beat) / hitsInLastBeat, 0.2);
  }
}
function HiHatRolls({ onExit, getCtx }: GameProps) {
  const ROUNDS = 10;
  const s = useSession(ROUNDS);
  const [q, setQ] = useState<{ answer: string; choices: string[] } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const next = () => {
    const names = Object.keys(ROLLS);
    const answer = pick(names);
    setQ({ answer, choices: shuffle([answer, ...shuffle(names.filter((k) => k !== answer)).slice(0, 3)]) }); setSel(null);
    playRoll(getCtx(), ROLLS[answer]);
  };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (s.finished) return <SessionDone title="Hi-Hat Roll ID" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Hi-Hat Roll ID" round={s.round + (sel ? 0 : 1)} rounds={ROUNDS}>
      <p className="text-center text-gray-500 text-sm mb-3">A trap beat at 140 BPM with a hi-hat roll on beat 4. What&apos;s the roll?</p>
      <div className="text-center mb-5"><button type="button" className="btn btn-outline btn-sm" onClick={() => q && playRoll(getCtx(), ROLLS[q.answer])}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button></div>
      {q && <ChoiceGrid choices={q.choices} answer={q.answer} selected={sel} onPick={(c) => { setSel(c); s.add(c === q.answer ? 100 : 0); }} />}
      {sel && q && <NextLine ok={sel === q.answer} wrong={`Not quite — it was ${q.answer}`} onNext={next} label="Next Roll" s={s} />}
    </GameCard>
  );
}

// ── Menu ──────────────────────────────────────────────────────────────────────

type GameId = "dictation" | "meter" | "groove" | "tempo" | "change" | "tap" | "pulse" | "offbeat" | "poly" | "rebuild" | "rolls";
const SECTIONS: { title: string; games: { id: GameId; icon: IconDefinition; title: string; desc: string }[] }[] = [
  { title: "Recognize", games: [
    { id: "dictation", icon: faMusic, title: "Rhythm Dictation", desc: "Hear a rhythm and pick the matching notation" },
    { id: "meter", icon: faClock, title: "Time Signature Detective", desc: "Is it 3/4, 4/4, 6/8… or 7/8?" },
    { id: "groove", icon: faDrum, title: "Groove ID", desc: "Dembow, trap, boom bap, house, one drop, afrobeats, clave" },
    { id: "tempo", icon: faGaugeHigh, title: "Tempo Guess", desc: "Guess the BPM — tap tempo allowed" },
    { id: "change", icon: faCodeCompare, title: "Spot the Change", desc: "Same rhythm twice — or did one beat change?" },
    { id: "rolls", icon: faBolt, title: "Hi-Hat Roll ID", desc: "1/16, triplets, 1/32 or 1/64?" },
  ] },
  { title: "Perform", games: [
    { id: "tap", icon: faHandPointer, title: "Tap It Back", desc: "Tap a rhythm back and see your timing in milliseconds" },
    { id: "pulse", icon: faWaveSquare, title: "Steady Pulse", desc: "Keep the beat when the metronome goes silent" },
    { id: "offbeat", icon: faMusic, title: "Off-Beat Challenge", desc: "Tap only the “ands” — or only 2 and 4" },
    { id: "poly", icon: faArrowsLeftRight, title: "Polyrhythm Trainer", desc: "3 against 2, 4 against 3, 5 against 4" },
  ] },
  { title: "Build", games: [
    { id: "rebuild", icon: faTableCells, title: "Rebuild the Beat", desc: "Hear a drum loop and recreate it on a step grid" },
  ] },
];

const GAME_ICONS: Record<GameId, Icon3DName> = {
  dictation: "notebook", meter: "clock", groove: "headphone", tempo: "rocket", change: "zoom", rolls: "bell",
  tap: "thumb-up", pulse: "target", offbeat: "flag", poly: "puzzle", rebuild: "tools",
};

export default function RhythmTraining({ onBack }: { onBack: () => void }) {
  const getCtx = useAudio();
  const [game, setGame] = useState<GameId | null>(null);
  const exit = () => setGame(null);
  const props = { onExit: exit, getCtx };
  return (
    <div>
      <button type="button" onClick={game ? exit : onBack} className="mb-6 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
        ← {game ? "Back to rhythm games" : "Back to Melodic / Rhythmic"}
      </button>
      {/* Waveform of whatever the game is playing (only once a game is open) */}
      {game && <EarVisualizer />}
      {!game && SECTIONS.map((sec) => (
        <div key={sec.title} className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{sec.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sec.games.map((g) => (
              <button key={g.id} type="button" onClick={() => { getCtx(); setGame(g.id); }}
                className="p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left cursor-pointer">
                <div className="mb-2"><Icon3D name={GAME_ICONS[g.id]} size={56} /></div>
                <h3 className="font-bold text-gray-900 mb-1">{g.title}</h3>
                <p className="text-sm text-gray-500">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
      {game === "dictation" && <RhythmDictation {...props} />}
      {game === "meter" && <TimeSignature {...props} />}
      {game === "groove" && <GrooveId {...props} />}
      {game === "tempo" && <TempoGuess {...props} />}
      {game === "change" && <SpotTheChange {...props} />}
      {game === "tap" && <TapItBack {...props} />}
      {game === "pulse" && <TapAlong {...props} title="Steady Pulse" mode="pulse" />}
      {game === "offbeat" && <TapAlong {...props} title="Off-Beat Challenge" mode="offbeat" />}
      {game === "poly" && <Polyrhythm {...props} />}
      {game === "rebuild" && <RebuildBeat {...props} />}
      {game === "rolls" && <HiHatRolls {...props} />}
    </div>
  );
}
