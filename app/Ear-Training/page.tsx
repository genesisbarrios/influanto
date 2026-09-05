"use client";
import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import { PianoDiagram, SheetMusic } from "@/components/ChordDiagrams";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadphones,
  faMusic,
  faKeyboard,
  faMicrophone,
  faTrophy,
  faRotateRight,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ── Pitch detection (autocorrelation, same as Tuner) ─────────────────────────

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }

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

  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1] ?? c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const bv = (x3 - x1) / 2;
  if (a) T0 = T0 - bv / (2 * a);

  return sampleRate / T0;
}

const freqToMidi = (f: number) => Math.round(12 * Math.log2(f / 440) + 69);
const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const midiToName = (m: number) => NOTE_NAMES[(m % 12 + 12) % 12] + (Math.floor(m / 12) - 1);

// ── Audio helpers ─────────────────────────────────────────────────────────────

function playNote(ctx: AudioContext, freq: number, start: number, dur: number, vol = 0.35) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur - 0.04);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INTERVALS = [
  { n: 1, name: "Minor 2nd" }, { n: 2, name: "Major 2nd" }, { n: 3, name: "Minor 3rd" },
  { n: 4, name: "Major 3rd" }, { n: 5, name: "Perfect 4th" }, { n: 6, name: "Tritone" },
  { n: 7, name: "Perfect 5th" }, { n: 8, name: "Minor 6th" }, { n: 9, name: "Major 6th" },
  { n: 10, name: "Minor 7th" }, { n: 11, name: "Major 7th" }, { n: 12, name: "Octave" },
];

const CHORDS = [
  { type: "major", label: "Major", intervals: [0, 4, 7] },
  { type: "minor", label: "Minor", intervals: [0, 3, 7] },
  { type: "major7", label: "Major 7", intervals: [0, 4, 7, 11] },
  { type: "minor7", label: "Minor 7", intervals: [0, 3, 7, 10] },
  { type: "dominant7", label: "Dominant 7", intervals: [0, 4, 7, 10] },
] as const;

const PENTATONIC = [0, 2, 4, 7, 9];
const LEVEL_NOTE_COUNTS = [4, 5, 6, 7, 8];

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const NOTE_STEP_MS = 700;
const accColor = (pct: number) => pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

type Mode = "pitch" | "interval" | "chord";
type Voicing = "bass" | "tenor" | "alto" | "soprano";
type Presentation = "listening" | "sheet" | "piano";
const PRESENTATIONS: { id: Presentation; icon: IconDefinition; label: string }[] = [
  { id: "listening", icon: faHeadphones, label: "Listening" },
  { id: "sheet", icon: faMusic, label: "Sheet Music" },
  { id: "piano", icon: faKeyboard, label: "Piano" },
];

const VOICINGS: { id: Voicing; label: string; melodyBase: number; rootMin: number; rootMax: number }[] = [
  { id: "bass",    label: "Bass",    melodyBase: 36, rootMin: 36, rootMax: 48 },  // C2–C3
  { id: "tenor",   label: "Tenor",   melodyBase: 48, rootMin: 48, rootMax: 60 },  // C3–C4
  { id: "alto",    label: "Alto",    melodyBase: 60, rootMin: 60, rootMax: 72 },  // C4–C5
  { id: "soprano", label: "Soprano", melodyBase: 72, rootMin: 72, rootMax: 84 },  // C5–C6
];

export default function EarTraining() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [voicing, setVoicing] = useState<Voicing>("tenor");

  // Pitch matching
  const [level, setLevel] = useState(1); // 1-5, maps to LEVEL_NOTE_COUNTS
  const [melody, setMelody] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "playing" | "singing" | "result">("idle");
  const [activeNote, setActiveNote] = useState(-1);
  const [noteAccuracies, setNoteAccuracies] = useState<number[]>([]);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [rollingAvg, setRollingAvg] = useState<number | null>(null);
  const [liveFreq, setLiveFreq] = useState(0);
  const [singProgress, setSingProgress] = useState(0);
  const allScoresRef = useRef<number[]>([]);

  // Interval / chord
  const [presentation, setPresentation] = useState<Presentation>("listening");
  const [question, setQuestion] = useState<{ answer: string; choices: string[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  // Session tracking
  const SESSION_ROUNDS = 10;
  const [sessionDone, setSessionDone] = useState(false);
  const sessionStatsRef = useRef<Partial<Record<Mode, number>>>({});

  const [micError, setMicError] = useState("");

  // Audio refs
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const cancelRef = useRef(false);
  const intervalPayloadRef = useRef<{ root: number; semitones: number } | null>(null);
  const chordPayloadRef = useRef<{ root: number; intervals: readonly number[] } | null>(null);

  useEffect(() => {
    document.title = "Ear Training | Influanto";
    const setMeta = (attr: string, name: string, val: string) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    const desc = "Train your ear for pitch, intervals, and chords. Free ear training tool for musicians, producers, and singers.";
    setMeta("name", "description", desc);
    setMeta("property", "og:title", "Ear Training | Influanto");
    setMeta("property", "og:description", desc);
    return () => { cancelRef.current = true; stopMic(); };
  }, []);

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const stopMic = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  };

  const startMic = async (): Promise<boolean> => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      streamRef.current = stream;
      const ctx = getCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
      ctx.createMediaStreamSource(stream).connect(analyser);
      return true;
    } catch (e: any) {
      setMicError(e?.name === "NotAllowedError" ? "Microphone access was denied." : "Could not access microphone.");
      return false;
    }
  };

  // ── Pitch Matching ────────────────────────────────────────────────────────

  const startPitchRound = async () => {
    cancelRef.current = false;
    const vc = VOICINGS.find(v => v.id === voicing)!;
    const noteCount = LEVEL_NOTE_COUNTS[level - 1];
    const notes = Array.from({ length: noteCount }, () => vc.melodyBase + pick(PENTATONIC));
    setMelody(notes);
    setPhase("playing");
    setActiveNote(-1);
    setNoteAccuracies([]);
    setRoundScore(null);
    setLiveFreq(0);
    setSingProgress(0);

    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();

    // Play full melody with visual highlighting
    for (let i = 0; i < notes.length; i++) {
      if (cancelRef.current) return;
      setActiveNote(i);
      playNote(ctx, midiToFreq(notes[i]), ctx.currentTime, 0.75);
      await sleep(NOTE_STEP_MS);
    }
    setActiveNote(-1);
    await sleep(400);

    if (cancelRef.current) return;

    const ok = await startMic();
    if (!ok || cancelRef.current) { setPhase("idle"); return; }

    setPhase("singing");

    // Record the full melody duration in one go, split into per-note windows
    const singWindowMs = 900;
    const totalMs = notes.length * singWindowMs;
    const windowFreqs: number[][] = Array.from({ length: notes.length }, () => []);
    const startTime = Date.now();

    while (Date.now() - startTime < totalMs) {
      if (cancelRef.current) break;
      const elapsed = Date.now() - startTime;
      const windowIdx = Math.min(Math.floor(elapsed / singWindowMs), notes.length - 1);
      setSingProgress(elapsed / totalMs);
      setActiveNote(windowIdx);

      const analyser = analyserRef.current, buf = bufRef.current;
      if (analyser && buf) {
        analyser.getFloatTimeDomainData(buf);
        const f = autoCorrelate(buf, ctx.sampleRate);
        if (f > 0) { windowFreqs[windowIdx].push(f); setLiveFreq(f); }
      }
      await sleep(60);
    }

    stopMic();
    if (cancelRef.current) return;
    setSingProgress(1);

    const accuracies = windowFreqs.map((freqs, i) => {
      const sorted = [...freqs].sort((a, b) => a - b);
      const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
      const semitoneOff = median > 0 ? Math.abs(freqToMidi(median) - notes[i]) : 12;
      return Math.max(0, 100 - semitoneOff * 20);
    });

    const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    allScoresRef.current = [...allScoresRef.current, avg];
    const newAvg = allScoresRef.current.reduce((a, b) => a + b, 0) / allScoresRef.current.length;

    setNoteAccuracies(accuracies);
    setRoundScore(avg);
    setRollingAvg(newAvg);
    setActiveNote(-1);
    setPhase("result");

    if (allScoresRef.current.length >= SESSION_ROUNDS) {
      sessionStatsRef.current = { ...sessionStatsRef.current, pitch: newAvg };
      setSessionDone(true);
    }
  };

  const replayMelody = () => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    melody.forEach((note, i) => playNote(ctx, midiToFreq(note), ctx.currentTime + i * (NOTE_STEP_MS / 1000), 0.75));
  };

  // ── Interval Recognition ──────────────────────────────────────────────────

  const newIntervalQuestion = async () => {
    setSelected(null);
    setIsCorrect(null);
    const vc = VOICINGS.find(v => v.id === voicing)!;
    const root = vc.rootMin + Math.floor(Math.random() * (vc.rootMax - vc.rootMin));
    const interval = pick(INTERVALS);
    intervalPayloadRef.current = { root, semitones: interval.n };
    const choices = shuffle([interval.name, ...shuffle(INTERVALS.filter(i => i.n !== interval.n)).slice(0, 3).map(i => i.name)]);
    setQuestion({ answer: interval.name, choices });

    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    playNote(ctx, midiToFreq(root), ctx.currentTime, 0.8);
    playNote(ctx, midiToFreq(root + interval.n), ctx.currentTime + 0.9, 0.8);
  };

  const replayInterval = async () => {
    if (!intervalPayloadRef.current) return;
    const { root, semitones } = intervalPayloadRef.current;
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    playNote(ctx, midiToFreq(root), ctx.currentTime, 0.8);
    playNote(ctx, midiToFreq(root + semitones), ctx.currentTime + 0.9, 0.8);
  };

  const answerInterval = (choice: string) => {
    if (!question || selected !== null) return;
    setSelected(choice);
    const right = choice === question.answer;
    setIsCorrect(right);
    const newTotal = total + 1;
    const newScore = right ? score + 1 : score;
    setTotal(newTotal);
    if (right) setScore(newScore);
    if (newTotal >= SESSION_ROUNDS) {
      sessionStatsRef.current = { ...sessionStatsRef.current, interval: Math.round((newScore / newTotal) * 100) };
      setSessionDone(true);
    }
  };

  // ── Chord Recognition ─────────────────────────────────────────────────────

  const newChordQuestion = async () => {
    setSelected(null);
    setIsCorrect(null);
    const vc = VOICINGS.find(v => v.id === voicing)!;
    const root = vc.rootMin + Math.floor(Math.random() * (vc.rootMax - vc.rootMin));
    const chord = pick(CHORDS);
    chordPayloadRef.current = { root, intervals: chord.intervals };
    setQuestion({ answer: chord.label, choices: shuffle(CHORDS.map(c => c.label)) });

    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    chord.intervals.forEach(interval => playNote(ctx, midiToFreq(root + interval), ctx.currentTime, 1.5, 0.18));
  };

  const replayChord = async () => {
    if (!chordPayloadRef.current) return;
    const { root, intervals } = chordPayloadRef.current;
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    intervals.forEach(interval => playNote(ctx, midiToFreq(root + interval), ctx.currentTime, 1.5, 0.18));
  };

  const answerChord = (choice: string) => {
    if (!question || selected !== null) return;
    setSelected(choice);
    const right = choice === question.answer;
    setIsCorrect(right);
    const newTotal = total + 1;
    const newScore = right ? score + 1 : score;
    setTotal(newTotal);
    if (right) setScore(newScore);
    if (newTotal >= SESSION_ROUNDS) {
      sessionStatsRef.current = { ...sessionStatsRef.current, chord: Math.round((newScore / newTotal) * 100) };
      setSessionDone(true);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetMode = () => {
    cancelRef.current = true;
    stopMic();
    setMode(null);
    setPhase("idle");
    setScore(0);
    setTotal(0);
    setQuestion(null);
    setSelected(null);
    setIsCorrect(null);
    allScoresRef.current = [];
    setRollingAvg(null);
    setRoundScore(null);
    setMicError("");
    setSessionDone(false);
  };

  const restartSession = () => {
    cancelRef.current = false;
    setPhase("idle");
    setScore(0);
    setTotal(0);
    setQuestion(null);
    setSelected(null);
    setIsCorrect(null);
    allScoresRef.current = [];
    setRollingAvg(null);
    setRoundScore(null);
    setMicError("");
    setSessionDone(false);
    if (mode === "interval") newIntervalQuestion();
    if (mode === "chord") newChordQuestion();
  };

  // ── Presentation selector (Listening / Sheet Music / Piano) ────────────────

  const PresentationSelector = () => (
    <div className="flex justify-center gap-2 mb-6 flex-wrap">
      {PRESENTATIONS.map(p => (
        <button
          key={p.id}
          onClick={() => setPresentation(p.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all cursor-pointer ${presentation === p.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"}`}
        >
          <FontAwesomeIcon icon={p.icon} className="mr-1" /> {p.label}
        </button>
      ))}
    </div>
  );

  // ── Choice button helper ──────────────────────────────────────────────────

  const ChoiceBtn = ({ label, answer, onClick }: { label: string; answer: string; onClick: () => void }) => {
    const isSelected = selected === label;
    const isAnswer = label === answer;
    let base = "p-4 rounded-xl border-2 font-semibold text-sm transition-all ";
    if (selected === null) base += "bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";
    else if (isAnswer) base += "bg-green-50 border-green-500 text-green-700 cursor-default";
    else if (isSelected) base += "bg-red-50 border-red-400 text-red-700 cursor-default";
    else base += "bg-white border-gray-200 text-gray-400 cursor-default";
    return <button className={base} onClick={onClick}>{label}</button>;
  };

  return (
    <>
      <Suspense><Header /></Suspense>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-10">

          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2"><FontAwesomeIcon icon={faMusic} className="mr-2" /> Ear Training</h1>
            <p className="text-gray-500">Train your ear to match pitches and recognize intervals and chords.</p>
          </div>

          {/* Voicing selector */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {VOICINGS.map(v => (
              <button
                key={v.id}
                onClick={() => setVoicing(v.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${voicing === v.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Mode selection */}
          {!mode && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { id: "pitch" as Mode, icon: faMicrophone, title: "Pitch Matching", desc: "Sing back a melody and score your accuracy" },
                { id: "interval" as Mode, icon: faMusic, title: "Interval Recognition", desc: "Identify all intervals from minor 2nd to octave" },
                { id: "chord" as Mode, icon: faKeyboard, title: "Chord Recognition", desc: "Identify major, minor, major 7, minor 7, and dominant 7 chords" },
              ] as const).map(m => (
                <button key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    if (m.id === "interval") newIntervalQuestion();
                    if (m.id === "chord") newChordQuestion();
                  }}
                  className="p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <div className="text-4xl mb-3 text-blue-600"><FontAwesomeIcon icon={m.icon} /></div>
                  <h3 className="font-bold text-gray-900 mb-1">{m.title}</h3>
                  <p className="text-sm text-gray-500">{m.desc}</p>
                </button>
              ))}
            </div>
          )}

          {mode && !sessionDone && (
            <button onClick={resetMode} className="mb-6 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
              ← Back to modes
            </button>
          )}

          {/* ── Session Complete ── */}
          {sessionDone && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="text-5xl mb-4 text-yellow-500"><FontAwesomeIcon icon={faTrophy} /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Session Complete!</h2>
              <p className="text-gray-500 text-sm mb-6">{SESSION_ROUNDS} rounds finished</p>

              <div className="flex flex-col gap-3 mb-8 max-w-xs mx-auto">
                {(["pitch", "interval", "chord"] as Mode[]).map(m => {
                  const s = sessionStatsRef.current[m];
                  if (s === undefined) return null;
                  const labels: Record<Mode, { icon: IconDefinition; text: string }> = {
                    pitch: { icon: faMicrophone, text: "Pitch Matching" },
                    interval: { icon: faMusic, text: "Interval Recognition" },
                    chord: { icon: faKeyboard, text: "Chord Recognition" },
                  };
                  return (
                    <div key={m} className="flex justify-between items-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        <FontAwesomeIcon icon={labels[m].icon} className="mr-1.5" /> {labels[m].text}
                      </span>
                      <span className="text-lg font-bold" style={{ color: accColor(s) }}>{s}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-3">
                <button onClick={restartSession} className="btn btn-primary btn-sm">Play Again</button>
                <button onClick={resetMode} className="btn btn-outline btn-sm">Change Mode</button>
              </div>
            </div>
          )}

          {/* ── Pitch Matching ── */}
          {mode === "pitch" && !sessionDone && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Pitch Matching</h2>
                {rollingAvg !== null && (
                  <span className="text-sm text-gray-500">
                    Avg: <span className="font-bold" style={{ color: accColor(rollingAvg) }}>{rollingAvg.toFixed(0)}%</span>
                    <span className="text-gray-400"> · {allScoresRef.current.length}/{SESSION_ROUNDS}</span>
                  </span>
                )}
              </div>

              {/* Difficulty / level selector */}
              <div className="flex justify-center items-center gap-2 mb-6 flex-wrap">
                <span className="text-xs font-medium text-gray-400 mr-1">Difficulty:</span>
                {LEVEL_NOTE_COUNTS.map((_, i) => {
                  const lvl = i + 1;
                  const disabled = phase !== "idle";
                  return (
                    <button
                      key={lvl}
                      onClick={() => !disabled && setLevel(lvl)}
                      disabled={disabled}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all ${level === lvl ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      Lvl {lvl}
                    </button>
                  );
                })}
              </div>

              {/* Note tiles */}
              {melody.length > 0 && (
                <div className="flex justify-center gap-3 mb-6">
                  {melody.map((note, i) => {
                    const isActive = (phase === "singing" || phase === "playing") && activeNote === i;
                    const hasResult = phase === "result" && noteAccuracies[i] !== undefined;
                    const acc = noteAccuracies[i];
                    const bg = hasResult ? (acc >= 80 ? "#dcfce7" : acc >= 50 ? "#fef3c7" : "#fee2e2")
                      : isActive ? "#dbeafe" : "#f9fafb";
                    const border = hasResult ? (acc >= 80 ? "#16a34a" : acc >= 50 ? "#d97706" : "#dc2626")
                      : isActive ? "#3b82f6" : "#e5e7eb";
                    return (
                      <div key={i} style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, width: 72, padding: "10px 0", textAlign: "center", transition: "all 0.2s" }}>
                        <div className="text-lg font-bold text-gray-800">{midiToName(note)}</div>
                        {hasResult && <div className="text-xs font-bold" style={{ color: accColor(acc) }}>{acc.toFixed(0)}%</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {phase === "idle" && (
                <div className="text-center">
                  <button onClick={startPitchRound} className="btn btn-primary px-8">Start Round</button>
                  <p className="text-xs text-gray-400 mt-3">A {LEVEL_NOTE_COUNTS[level - 1]}-note melody will play — then sing the whole melody back.</p>
                </div>
              )}

              {phase === "playing" && (
                <div className="text-center">
                  <p className="text-xl font-semibold text-blue-600 mb-3"><FontAwesomeIcon icon={faMusic} className="mr-2" /> Listen to the melody…</p>
                  <div className="flex justify-center gap-2">
                    {melody.map((_, i) => (
                      <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: activeNote === i ? "#3b82f6" : "#e5e7eb", transition: "background 0.15s" }} />
                    ))}
                  </div>
                </div>
              )}

              {phase === "singing" && (
                <div className="text-center">
                  <p className="text-xl font-semibold text-green-600 mb-1"><FontAwesomeIcon icon={faMicrophone} className="mr-2" /> Sing the whole melody back!</p>
                  {liveFreq > 0 && (
                    <p className="text-xs text-gray-400 mb-3">{liveFreq.toFixed(1)} Hz · {midiToName(freqToMidi(liveFreq))}</p>
                  )}
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                    <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${singProgress * 100}%` }} />
                  </div>
                  {micError && <p className="text-red-500 text-sm mt-2">{micError}</p>}
                </div>
              )}

              {phase === "result" && (
                <div className="text-center">
                  <p className="text-3xl font-bold mb-1" style={{ color: accColor(roundScore!) }}>
                    {roundScore!.toFixed(0)}%
                  </p>
                  <p className="text-gray-500 text-sm mb-5">
                    {roundScore! >= 90 ? <><FontAwesomeIcon icon={faTrophy} className="mr-1.5 text-yellow-500" /> Perfect pitch!</> : roundScore! >= 70 ? "Great job! Keep it up." : roundScore! >= 40 ? "Good try — keep practicing!" : "Keep going, practice makes perfect!"}
                  </p>
                  <div className="flex justify-center gap-3">
                    <button onClick={replayMelody} className="btn btn-outline btn-sm"><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Replay Melody</button>
                    <button onClick={startPitchRound} className="btn btn-primary btn-sm">Next Round</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Interval Recognition ── */}
          {mode === "interval" && !sessionDone && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Interval Recognition</h2>
                <span className="text-sm font-medium text-gray-500">{total}/{SESSION_ROUNDS}</span>
              </div>

              <PresentationSelector />

              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-3">
                  {presentation === "listening" ? "What interval is this?" : presentation === "sheet" ? "What interval is notated here?" : "What interval are these piano keys?"}
                </p>
                {presentation !== "listening" && intervalPayloadRef.current && (
                  <div className="mb-4">
                    {presentation === "piano"
                      ? <PianoDiagram root={intervalPayloadRef.current.root} intervals={[0, intervalPayloadRef.current.semitones]} />
                      : <SheetMusic root={intervalPayloadRef.current.root} intervals={[0, intervalPayloadRef.current.semitones]} />}
                  </div>
                )}
                <button onClick={replayInterval} className="btn btn-outline btn-sm"><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button>
              </div>

              {question && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {question.choices.map(choice => (
                      <ChoiceBtn key={choice} label={choice} answer={question.answer} onClick={() => answerInterval(choice)} />
                    ))}
                  </div>

                  {selected !== null && !sessionDone && (
                    <div className="text-center mt-2">
                      <p className={`font-bold mb-3 ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                        {isCorrect ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" /> Correct!</> : `Not quite — it was ${question.answer}`}
                      </p>
                      <button onClick={newIntervalQuestion} className="btn btn-primary btn-sm">Next Interval</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Chord Recognition ── */}
          {mode === "chord" && !sessionDone && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Chord Recognition</h2>
                <span className="text-sm font-medium text-gray-500">{total}/{SESSION_ROUNDS}</span>
              </div>

              <PresentationSelector />

              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-3">
                  {presentation === "listening" ? "What type of chord is this?" : presentation === "sheet" ? "What chord is notated here?" : "What chord are these piano keys?"}
                </p>
                {presentation !== "listening" && chordPayloadRef.current && (
                  <div className="mb-4">
                    {presentation === "piano"
                      ? <PianoDiagram root={chordPayloadRef.current.root} intervals={chordPayloadRef.current.intervals} />
                      : <SheetMusic root={chordPayloadRef.current.root} intervals={chordPayloadRef.current.intervals} />}
                  </div>
                )}
                <button onClick={replayChord} className="btn btn-outline btn-sm"><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button>
              </div>

              {question && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {question.choices.map(choice => (
                      <ChoiceBtn key={choice} label={choice} answer={question.answer} onClick={() => answerChord(choice)} />
                    ))}
                  </div>

                  {selected !== null && !sessionDone && (
                    <div className="text-center mt-2">
                      <p className={`font-bold mb-3 ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                        {isCorrect ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" /> Correct!</> : `Not quite — it was ${question.answer}`}
                      </p>
                      <button onClick={newChordQuestion} className="btn btn-primary btn-sm">Next Chord</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
