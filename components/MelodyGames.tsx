"use client";
// More melodic ear training: dictation, scales and modes, progressions, bass
// lines, singing intervals, key center, inversions, extended chords, perfect
// pitch and melody memory. Notes are synthesized (Web Audio) and routed through
// the shared output so the waveform shows them; `base` is the MIDI note the
// player's voicing (bass / tenor / alto / soprano) starts from.
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight, faMicrophone, faPlay } from "@fortawesome/free-solid-svg-icons";
import EarVisualizer, { audioOut } from "@/components/EarVisualizer";
import Icon3D, { type Icon3DName } from "@/components/Icon3D";
import { accColor, shuffle, pick, sleep, Pills, ChoiceGrid, GameCard, SessionDone, useSession, NextLine } from "@/components/EarTrainingUI";
import { autoCorrelate, midiToFreq, NOTE_NAMES } from "@/libs/pitch";

const pc = (m: number) => NOTE_NAMES[((m % 12) + 12) % 12];
const nameOf = (m: number) => pc(m) + (Math.floor(m / 12) - 1);

// ── Sound ─────────────────────────────────────────────────────────────────────

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

// A soft electric-piano-ish note: triangle plus a quiet sine an octave up
function note(ctx: AudioContext, midi: number, t: number, dur = 0.6, vol = 0.22) {
  const f = midiToFreq(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(audioOut(ctx));
  [["triangle", f, 1], ["sine", f * 2, 0.25]].forEach(([type, freq, k]) => {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = type as "triangle" | "sine";
    o.frequency.value = freq as number;
    og.gain.value = k as number;
    o.connect(og); og.connect(g);
    o.start(t); o.stop(t + dur + 0.05);
  });
}
const chordAt = (ctx: AudioContext, midis: number[], t: number, dur = 0.9) => midis.forEach((m) => note(ctx, m, t, dur, 0.16));
function sequence(ctx: AudioContext, midis: number[], step = 0.42, at = ctx.currentTime + 0.1) {
  midis.forEach((m, i) => note(ctx, m, at + i * step, step * 1.4));
  return at + midis.length * step;
}

// ── Music theory ──────────────────────────────────────────────────────────────

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const QUAL: Record<string, number[]> = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], "7": [0, 4, 7, 10] };
const SCALES: Record<string, { level: number; steps: number[] }> = {
  Major: { level: 1, steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  "Natural Minor": { level: 1, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  "Major Pentatonic": { level: 1, steps: [0, 2, 4, 7, 9, 12] },
  "Minor Pentatonic": { level: 1, steps: [0, 3, 5, 7, 10, 12] },
  "Harmonic Minor": { level: 2, steps: [0, 2, 3, 5, 7, 8, 11, 12] },
  Dorian: { level: 2, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  Mixolydian: { level: 2, steps: [0, 2, 4, 5, 7, 9, 10, 12] },
  Blues: { level: 2, steps: [0, 3, 5, 6, 7, 10, 12] },
  Phrygian: { level: 3, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  Lydian: { level: 3, steps: [0, 2, 4, 6, 7, 9, 11, 12] },
  Locrian: { level: 3, steps: [0, 1, 3, 5, 6, 8, 10, 12] },
  "Melodic Minor": { level: 3, steps: [0, 2, 3, 5, 7, 9, 11, 12] },
};
// [root offset from the key, quality]
const PROGS: Record<string, [number, string][]> = {
  "I–V–vi–IV": [[0, "M"], [7, "M"], [9, "m"], [5, "M"]],
  "vi–IV–I–V": [[9, "m"], [5, "M"], [0, "M"], [7, "M"]],
  "I–vi–IV–V": [[0, "M"], [9, "m"], [5, "M"], [7, "M"]],
  "I–IV–V–I": [[0, "M"], [5, "M"], [7, "M"], [0, "M"]],
  "ii–V–I": [[2, "m7"], [7, "7"], [0, "M7"]],
  "i–VI–III–VII": [[0, "m"], [8, "M"], [3, "M"], [10, "M"]],
  "i–iv–v–i": [[0, "m"], [5, "m"], [7, "m"], [0, "m"]],
  "i–VII–VI–V": [[0, "m"], [10, "M"], [8, "M"], [7, "M"]],
};
const progChords = (key: number, prog: [number, string][]) => prog.map(([o, q]) => QUAL[q].map((i) => key + o + i));
function playProg(ctx: AudioContext, key: number, prog: [number, string][], bass?: number[], at = ctx.currentTime + 0.1) {
  const step = 0.95;
  progChords(key, prog).forEach((c, i) => {
    chordAt(ctx, c, at + i * step, step);
    if (bass) note(ctx, bass[i], at + i * step, step, 0.3);
  });
  return at + prog.length * step;
}
const EXTENDED: Record<string, number[]> = {
  "Major 9": [0, 4, 7, 11, 14], "Minor 9": [0, 3, 7, 10, 14], "Dominant 9": [0, 4, 7, 10, 14],
  "Sus2": [0, 2, 7], "Sus4": [0, 5, 7], "Add9": [0, 4, 7, 14], "6th": [0, 4, 7, 9],
  "Minor 11": [0, 3, 7, 10, 14, 17], "7♯9": [0, 4, 7, 10, 15],
};
const INTERVALS = [
  { n: 2, name: "Major 2nd", easy: false }, { n: 3, name: "Minor 3rd", easy: false }, { n: 4, name: "Major 3rd", easy: true },
  { n: 5, name: "Perfect 4th", easy: true }, { n: 7, name: "Perfect 5th", easy: true }, { n: 9, name: "Major 6th", easy: false },
  { n: 12, name: "Octave", easy: true },
];

type GameProps = { onExit: () => void; getCtx: () => AudioContext; base: number };

// A melody drawn as a little piano roll, with note names under it
function MelodyRoll({ notes }: { notes: number[] }) {
  const lo = Math.min(...notes), hi = Math.max(...notes), span = Math.max(1, hi - lo);
  const W = 220, H = 54;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 240 }}>
        <line x1={4} x2={W - 4} y1={H - 2} y2={H - 2} stroke="#e5e7eb" />
        {notes.map((m, i) => {
          const w = (W - 8) / notes.length;
          const y = 4 + (1 - (m - lo) / span) * (H - 18);
          return <rect key={i} x={4 + i * w + 2} y={y} width={w - 4} height={10} rx={4} fill="#2563eb" />;
        })}
      </svg>
      <span className="text-xs font-mono text-gray-500">{notes.map(pc).join(" · ")}</span>
    </div>
  );
}

const QUIZ_ROUNDS = 10;

// Shared shell for the multiple-choice games: plays on each new question, replays on demand
function useQuiz<Q extends { answer: string; choices: string[] }>(make: () => Q, play: (q: Q) => void) {
  const s = useSession(QUIZ_ROUNDS);
  const [q, setQ] = useState<Q | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const next = () => { const nq = make(); setQ(nq); setSel(null); play(nq); };
  const answer = (c: string) => { if (!q) return; setSel(c); s.add(c === q.answer ? 100 : 0); };
  return { s, q, sel, next, answer, replay: () => q && play(q) };
}

function QuizBody<Q extends { answer: string; choices: string[] }>({ quiz, prompt, nextLabel, render, wrong, extra }: {
  quiz: ReturnType<typeof useQuiz<Q>>; prompt: string; nextLabel: string; render?: (c: string) => React.ReactNode; wrong?: (q: Q) => string; extra?: React.ReactNode;
}) {
  const { q, sel, s } = quiz;
  return (
    <>
      <p className="text-center text-gray-500 text-sm mb-3">{prompt}</p>
      <div className="text-center mb-5"><button type="button" className="btn btn-outline btn-sm" onClick={quiz.replay}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Play Again</button></div>
      {extra}
      {q && <ChoiceGrid choices={q.choices} answer={q.answer} selected={sel} onPick={quiz.answer} render={render} />}
      {sel && q && <NextLine ok={sel === q.answer} wrong={wrong ? wrong(q) : `Not quite — it was ${q.answer}`} onNext={quiz.next} label={nextLabel} s={s} />}
    </>
  );
}

// ── 1. Melodic Dictation ──────────────────────────────────────────────────────

function makeMelody(base: number, level: number) {
  const len = [3, 4, 5, 6][level - 1];
  const key = base + Math.floor(Math.random() * 7);
  const out: number[] = [];
  let deg = 0;
  for (let i = 0; i < len; i++) {
    if (i) deg += level === 1 ? pick([-1, 1]) : level === 2 ? pick([-2, -1, 1, 2]) : pick([-4, -3, -2, -1, 1, 2, 3, 4]);
    deg = Math.max(-2, Math.min(9, deg));
    let m = key + Math.floor(deg / 7) * 12 + MAJOR[((deg % 7) + 7) % 7];
    if (level === 4 && Math.random() < 0.25) m += pick([-1, 1]); // a chromatic note now and then
    out.push(m);
  }
  return out;
}
function MelodicDictation({ onExit, getCtx, base }: GameProps) {
  const [level, setLevel] = useState(1);
  const melodies = useRef<Record<string, number[]>>({});
  const lvl = useRef(1);
  const quiz = useQuiz(() => {
    melodies.current = {};
    while (Object.keys(melodies.current).length < 4) { const m = makeMelody(base, lvl.current); melodies.current[m.join(",")] = m; }
    const choices = Object.keys(melodies.current);
    return { answer: pick(choices), choices };
  }, (q) => sequence(getCtx(), melodies.current[q.answer]));
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Melodic Dictation" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Melodic Dictation" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <Pills label="Notes" options={[1, 2, 3, 4].map((l) => ({ id: l, label: `${[3, 4, 5, 6][l - 1]} notes` }))} value={level} onChange={(l) => { setLevel(l); lvl.current = l; quiz.next(); }} disabled={quiz.sel !== null} />
      <QuizBody quiz={quiz} prompt="Which melody did you hear?" nextLabel="Next Melody" wrong={() => "Not quite — the highlighted one was played."}
        render={(c) => <MelodyRoll notes={melodies.current[c] ?? []} />} />
    </GameCard>
  );
}

// ── 2. Scale & Mode ID ────────────────────────────────────────────────────────

function ScaleId({ onExit, getCtx, base }: GameProps) {
  const [level, setLevel] = useState(1);
  const lvl = useRef(1);
  const root = useRef(base);
  const quiz = useQuiz(() => {
    const pool = Object.keys(SCALES).filter((k) => SCALES[k].level <= lvl.current);
    const answer = pick(pool);
    root.current = base + Math.floor(Math.random() * 7);
    return { answer, choices: shuffle([answer, ...shuffle(pool.filter((k) => k !== answer)).slice(0, 3)]) };
  }, (q) => sequence(getCtx(), SCALES[q.answer].steps.map((st) => root.current + st), 0.32));
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Scale & Mode ID" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Scale & Mode ID" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <Pills label="Difficulty" options={[{ id: 1, label: "Basic" }, { id: 2, label: "+ Modes & blues" }, { id: 3, label: "All" }]} value={level} onChange={(l) => { setLevel(l); lvl.current = l; quiz.next(); }} disabled={quiz.sel !== null} />
      <QuizBody quiz={quiz} prompt="Which scale or mode is this?" nextLabel="Next Scale" />
    </GameCard>
  );
}

// ── 3. Chord Progressions ─────────────────────────────────────────────────────

function Progressions({ onExit, getCtx, base }: GameProps) {
  const key = useRef(base);
  const quiz = useQuiz(() => {
    const names = Object.keys(PROGS);
    const answer = pick(names);
    key.current = base + Math.floor(Math.random() * 7);
    return { answer, choices: shuffle([answer, ...shuffle(names.filter((k) => k !== answer)).slice(0, 3)]) };
  }, (q) => playProg(getCtx(), key.current, PROGS[q.answer], progChords(key.current, PROGS[q.answer]).map((c) => c[0] - 12)));
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Chord Progressions" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Chord Progressions" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <QuizBody quiz={quiz} prompt="Which progression is this? (Uppercase = major, lowercase = minor)" nextLabel="Next Progression" />
    </GameCard>
  );
}

// ── 4. Bass Line Match ────────────────────────────────────────────────────────

function BassLine({ onExit, getCtx, base }: GameProps) {
  const setup = useRef<{ key: number; prog: [number, string][]; lines: Record<string, number[]> }>({ key: base, prog: PROGS["I–V–vi–IV"], lines: {} });
  const quiz = useQuiz(() => {
    const prog = PROGS[pick(Object.keys(PROGS).filter((k) => PROGS[k].length === 4))];
    const key = base + Math.floor(Math.random() * 7);
    const roots = progChords(key, prog).map((c) => c[0] - 12);
    const lines: Record<string, number[]> = { A: roots };
    const wrongs = [
      shuffle(roots),
      roots.map((r, i) => (i % 2 ? r + 4 : r)),          // thirds on 2 and 4
      roots.map((r) => r + pick([2, 5, 7, -2])),          // off the chord tones
      [...roots].reverse(),
    ].filter((l) => l.join() !== roots.join());
    ["B", "C", "D"].forEach((k, i) => (lines[k] = wrongs[i % wrongs.length]));
    // shuffle which letter is right
    const letters = shuffle(["A", "B", "C", "D"]);
    const mapped: Record<string, number[]> = {};
    Object.keys(lines).forEach((k, i) => (mapped[letters[i]] = lines[k]));
    setup.current = { key, prog, lines: mapped };
    return { answer: letters[0], choices: ["A", "B", "C", "D"] };
  }, () => { const { key, prog } = setup.current; playProg(getCtx(), key, prog); });
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Bass Line Match" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  const preview = (k: string) => { const { key, prog, lines } = setup.current; playProg(getCtx(), key, prog, lines[k]); };
  return (
    <GameCard title="Bass Line Match" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <QuizBody quiz={quiz} prompt="Which bass line fits these chords? Preview each one, then pick." nextLabel="Next Progression"
        extra={<div className="flex justify-center gap-2 mb-4 flex-wrap">{["A", "B", "C", "D"].map((k) => (
          <button key={k} type="button" className="btn btn-sm btn-ghost" onClick={() => preview(k)}><FontAwesomeIcon icon={faPlay} className="mr-1" /> {k}</button>
        ))}</div>}
        render={(c) => <span><b>{c}</b> <span className="font-mono text-xs text-gray-500 ml-1">{(setup.current.lines[c] ?? []).map(pc).join(" – ")}</span></span>} />
    </GameCard>
  );
}

// ── 5. Sing the Interval ──────────────────────────────────────────────────────

function SingInterval({ onExit, getCtx, base }: GameProps) {
  const ROUNDS = 8;
  const s = useSession(ROUNDS);
  const [all, setAll] = useState(false);
  const [q, setQ] = useState<{ root: number; n: number; name: string } | null>(null);
  const [phase, setPhase] = useState<"idle" | "listen" | "sing" | "result">("idle");
  const [result, setResult] = useState<{ score: number; cents: number; heard: string } | null>(null);
  const [err, setErr] = useState("");
  const next = (allIntervals = all) => {
    const pool = INTERVALS.filter((i) => allIntervals || i.easy);
    const i = pick(pool);
    setQ({ root: base + Math.floor(Math.random() * 5), n: i.n, name: i.name }); setPhase("idle"); setResult(null); setErr("");
  };
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async () => {
    if (!q) return;
    const ctx = getCtx();
    setPhase("listen"); setErr("");
    note(ctx, q.root, ctx.currentTime + 0.05, 1.2, 0.3);
    await sleep(1300);
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setErr("Microphone access is needed to sing."); setPhase("idle"); return; }
    setPhase("sing");
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    src.connect(an);
    const buf = new Float32Array(2048);
    const freqs: number[] = [];
    const end = performance.now() + 2600;
    while (performance.now() < end) {
      an.getFloatTimeDomainData(buf);
      const f = autoCorrelate(buf, ctx.sampleRate);
      if (f > 60 && f < 1500) freqs.push(f);
      await sleep(40);
    }
    stream.getTracks().forEach((t) => t.stop());
    src.disconnect();
    if (freqs.length < 5) { setResult({ score: 0, cents: 0, heard: "nothing" }); s.add(0); setPhase("result"); return; }
    freqs.sort((a, b) => a - b);
    const f = freqs[Math.floor(freqs.length / 2)];
    const target = midiToFreq(q.root + q.n);
    // compare pitch classes so any octave counts (bass and soprano voices both work)
    let cents = (1200 * Math.log2(f / target)) % 1200;
    if (cents > 600) cents -= 1200;
    if (cents < -600) cents += 1200;
    const a = Math.abs(cents);
    const score = a <= 25 ? 100 : a <= 50 ? 80 : a <= 100 ? 40 : 0;
    const heardMidi = Math.round(69 + 12 * Math.log2(f / 440));
    setResult({ score, cents: Math.round(cents), heard: nameOf(heardMidi) }); s.add(score); setPhase("result");
  };
  if (s.finished) return <SessionDone title="Sing the Interval" score={s.avg} rounds={ROUNDS} onAgain={() => { s.reset(); next(); }} onExit={onExit} />;
  return (
    <GameCard title="Sing the Interval" round={s.round + (phase === "result" ? 0 : 1)} rounds={ROUNDS}>
      <Pills label="Intervals" options={[{ id: "easy", label: "3rds, 4ths, 5ths, octave" }, { id: "all", label: "All" }]} value={all ? "all" : "easy"} onChange={(v) => { const a = v === "all"; setAll(a); next(a); }} disabled={phase !== "idle"} />
      {q && (
        <div className="text-center mb-5">
          <p className="text-gray-500 text-sm mb-1">Listen to the root note, then sing a</p>
          <p className="text-3xl font-black text-gray-900">{q.name} up</p>
          <p className="text-xs text-gray-400 mt-1">from {pc(q.root)} → {pc(q.root + q.n)} (any octave)</p>
        </div>
      )}
      {phase === "listen" && <p className="text-center text-blue-600 font-semibold">Listen…</p>}
      {phase === "sing" && <p className="text-center text-green-600 font-semibold"><FontAwesomeIcon icon={faMicrophone} className="mr-2" />Sing now!</p>}
      {phase === "result" && result && q && (
        <div className="text-center mb-3">
          <p className="text-3xl font-black" style={{ color: accColor(result.score) }}>{result.score}%</p>
          <p className="text-sm text-gray-500">{result.heard === "nothing" ? "Didn't hear you — try singing louder or closer to the mic." : `You sang ${result.heard}, ${result.cents === 0 ? "dead on" : `${Math.abs(result.cents)} cents ${result.cents > 0 ? "sharp" : "flat"}`}.`}</p>
        </div>
      )}
      {err && <p className="text-center text-red-500 text-sm mb-3">{err}</p>}
      <div className="flex justify-center gap-3 mt-3">
        {phase === "idle" && <button type="button" className="btn btn-primary" onClick={run}><FontAwesomeIcon icon={faPlay} className="mr-1.5" /> Start</button>}
        {phase === "result" && <>
          <button type="button" className="btn btn-outline btn-sm" onClick={run}><FontAwesomeIcon icon={faRotateRight} className="mr-1.5" /> Try Again</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => (s.done ? s.finish() : next())}>{s.done ? "See Results" : "Next Interval"}</button>
        </>}
      </div>
    </GameCard>
  );
}

// ── 6. Key Center ─────────────────────────────────────────────────────────────

function KeyCenter({ onExit, getCtx, base }: GameProps) {
  const [level, setLevel] = useState(1);
  const lvl = useRef(1);
  const melody = useRef<number[]>([]);
  const quiz = useQuiz(() => {
    const keyPc = Math.floor(Math.random() * 12);
    const key = base + keyPc;
    const degs = lvl.current === 1 ? [4, 2, 0, 4, 2, 1, 0] : lvl.current === 2 ? shuffle([1, 2, 3, 4, 5]).slice(0, 5).concat([4, 0]) : shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 7);
    melody.current = degs.map((d) => key + MAJOR[d]);
    const answer = pc(key);
    const others = shuffle(NOTE_NAMES.filter((n) => n !== answer)).slice(0, 3);
    return { answer, choices: shuffle([answer, ...others]) };
  }, () => {
    const ctx = getCtx();
    const t = ctx.currentTime + 0.1;
    note(ctx, base, t, 0.9, 0.28); // reference C
    sequence(ctx, melody.current, 0.4, t + 1.4);
    if (lvl.current === 1) { const k = melody.current[melody.current.length - 1]; chordAt(ctx, [k, k + 4, k + 7], t + 1.4 + melody.current.length * 0.4, 1.2); }
  });
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Key Center" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Key Center" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <Pills label="Difficulty" options={[{ id: 1, label: "Ends on home + chord" }, { id: 2, label: "Ends on home" }, { id: 3, label: "Anywhere" }]} value={level} onChange={(l) => { setLevel(l); lvl.current = l; quiz.next(); }} disabled={quiz.sel !== null} />
      <QuizBody quiz={quiz} prompt="First a reference C plays, then a melody in a major key. What's the key?" nextLabel="Next Melody" />
    </GameCard>
  );
}

// ── 7. Inversions ─────────────────────────────────────────────────────────────

const INV = ["Root position", "1st inversion", "2nd inversion", "3rd inversion"];
function Inversions({ onExit, getCtx, base }: GameProps) {
  const [sevenths, setSevenths] = useState(false);
  const sev = useRef(false);
  const voicing = useRef<number[]>([]);
  const quiz = useQuiz(() => {
    const root = base + Math.floor(Math.random() * 7);
    const chord = (sev.current ? pick([QUAL.M7, QUAL.m7, QUAL["7"]]) : pick([QUAL.M, QUAL.m])).map((i) => root + i);
    const inv = Math.floor(Math.random() * chord.length);
    voicing.current = [...chord.slice(inv), ...chord.slice(0, inv).map((m) => m + 12)];
    const choices = INV.slice(0, chord.length);
    return { answer: INV[inv], choices };
  }, () => { const ctx = getCtx(); const t = ctx.currentTime + 0.1; chordAt(ctx, voicing.current, t, 1.1); sequence(ctx, voicing.current, 0.35, t + 1.3); });
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Inversions" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Inversions" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <Pills label="Chords" options={[{ id: "triads", label: "Triads" }, { id: "sevenths", label: "7th chords" }]} value={sevenths ? "sevenths" : "triads"} onChange={(v) => { const x = v === "sevenths"; setSevenths(x); sev.current = x; quiz.next(); }} disabled={quiz.sel !== null} />
      <QuizBody quiz={quiz} prompt="Listen to the lowest note: which inversion is this chord in?" nextLabel="Next Chord" />
    </GameCard>
  );
}

// ── 8. Extended Chords ────────────────────────────────────────────────────────

function Extended({ onExit, getCtx, base }: GameProps) {
  const root = useRef(base);
  const quiz = useQuiz(() => {
    const names = Object.keys(EXTENDED);
    const answer = pick(names);
    root.current = base + Math.floor(Math.random() * 7);
    return { answer, choices: shuffle([answer, ...shuffle(names.filter((k) => k !== answer)).slice(0, 3)]) };
  }, (q) => { const ctx = getCtx(); const c = EXTENDED[q.answer].map((i) => root.current + i); const t = ctx.currentTime + 0.1; chordAt(ctx, c, t, 1.4); sequence(ctx, c, 0.3, t + 1.6); });
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Extended Chords" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Extended Chords" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <QuizBody quiz={quiz} prompt="Which chord color is this? (played together, then note by note)" nextLabel="Next Chord" />
    </GameCard>
  );
}

// ── 9. Perfect Pitch ──────────────────────────────────────────────────────────

function PerfectPitch({ onExit, getCtx, base }: GameProps) {
  const [allNotes, setAllNotes] = useState(false);
  const all = useRef(false);
  const midi = useRef(base);
  const quiz = useQuiz(() => {
    const pool = all.current ? NOTE_NAMES : NOTE_NAMES.filter((n) => !n.includes("#"));
    const answer = pick(pool);
    midi.current = base + NOTE_NAMES.indexOf(answer) + pick([0, 12]);
    return { answer, choices: [...pool] };
  }, () => { const ctx = getCtx(); note(ctx, midi.current, ctx.currentTime + 0.1, 1.4, 0.3); });
  useEffect(() => { quiz.next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (quiz.s.finished) return <SessionDone title="Perfect Pitch" score={quiz.s.avg} rounds={QUIZ_ROUNDS} onAgain={() => { quiz.s.reset(); quiz.next(); }} onExit={onExit} />;
  return (
    <GameCard title="Perfect Pitch" round={quiz.s.round + (quiz.sel ? 0 : 1)} rounds={QUIZ_ROUNDS}>
      <Pills label="Notes" options={[{ id: "naturals", label: "Naturals (no sharps)" }, { id: "all", label: "All 12" }]} value={allNotes ? "all" : "naturals"} onChange={(v) => { const a = v === "all"; setAllNotes(a); all.current = a; quiz.next(); }} disabled={quiz.sel !== null} />
      <QuizBody quiz={quiz} prompt="No reference note: just name the note you hear." nextLabel="Next Note" />
    </GameCard>
  );
}

// ── 10. Melody Memory ─────────────────────────────────────────────────────────

const PADS = [
  { off: 0, color: "#ef4444" }, { off: 2, color: "#f59e0b" }, { off: 4, color: "#22c55e" },
  { off: 7, color: "#3b82f6" }, { off: 9, color: "#a855f7" },
];
function MelodyMemory({ onExit, getCtx, base }: GameProps) {
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "show" | "play" | "over">("idle");
  const [best, setBest] = useState(0);
  const show = async (s: number[]) => {
    setPhase("show"); setInput([]);
    await sleep(500);
    for (const i of s) {
      const ctx = getCtx();
      note(ctx, base + PADS[i].off, ctx.currentTime + 0.02, 0.45, 0.3);
      setLit(i); await sleep(380); setLit(-1); await sleep(120);
    }
    setPhase("play");
  };
  const start = () => { const s = [Math.floor(Math.random() * PADS.length)]; setSeq(s); show(s); };
  const press = (i: number) => {
    if (phase !== "play") return;
    const ctx = getCtx();
    note(ctx, base + PADS[i].off, ctx.currentTime + 0.01, 0.4, 0.3);
    setLit(i); setTimeout(() => setLit(-1), 180);
    const nextInput = [...input, i];
    if (seq[nextInput.length - 1] !== i) { setBest((b) => Math.max(b, seq.length - 1)); setPhase("over"); return; }
    setInput(nextInput);
    if (nextInput.length === seq.length) {
      const s = [...seq, Math.floor(Math.random() * PADS.length)];
      setSeq(s); setTimeout(() => show(s), 450);
    }
  };
  return (
    <GameCard title="Melody Memory" round={Math.max(1, seq.length)} rounds={Math.max(1, seq.length)}>
      <p className="text-center text-gray-500 text-sm mb-5">
        {phase === "idle" && "Watch and listen, then play the melody back. It grows by one note each round."}
        {phase === "show" && "Listen…"}
        {phase === "play" && `Your turn — ${seq.length - input.length} note${seq.length - input.length === 1 ? "" : "s"} to go`}
        {phase === "over" && <span className="font-bold text-lg" style={{ color: accColor(Math.min(100, (seq.length - 1) * 12)) }}>You remembered {seq.length - 1} note{seq.length - 1 === 1 ? "" : "s"}! Best: {Math.max(best, seq.length - 1)}</span>}
      </p>
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        {PADS.map((p, i) => (
          <button key={i} type="button" onPointerDown={() => press(i)} disabled={phase !== "play"}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl font-bold text-white transition-all select-none touch-none"
            style={{ background: p.color, opacity: lit === i ? 1 : phase === "play" ? 0.75 : 0.45, transform: lit === i ? "scale(1.08)" : "none", boxShadow: lit === i ? `0 0 24px ${p.color}` : "none" }}>
            {pc(base + p.off)}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        {(phase === "idle" || phase === "over") && <button type="button" className="btn btn-primary" onClick={start}><FontAwesomeIcon icon={faPlay} className="mr-1.5" /> {phase === "over" ? "Play Again" : "Start"}</button>}
        {phase === "over" && <button type="button" className="btn btn-outline" onClick={onExit}>Change Game</button>}
      </div>
    </GameCard>
  );
}

// ── Menu ──────────────────────────────────────────────────────────────────────

type GameId = "dictation" | "scales" | "progressions" | "bass" | "sing" | "key" | "inversions" | "extended" | "perfect" | "memory";
const GAMES: { id: GameId; icon: Icon3DName; title: string; desc: string }[] = [
  { id: "dictation", icon: "notebook", title: "Melodic Dictation", desc: "Hear a short melody and pick it out" },
  { id: "scales", icon: "puzzle", title: "Scale & Mode ID", desc: "Major, minor, pentatonic, dorian, phrygian, blues…" },
  { id: "progressions", icon: "link", title: "Chord Progressions", desc: "I–V–vi–IV, ii–V–I, the reggaeton i–VI–III–VII…" },
  { id: "bass", icon: "headphone", title: "Bass Line Match", desc: "Pick the bass line that fits the chords" },
  { id: "sing", icon: "mic", title: "Sing the Interval", desc: "Hear a note, sing the interval above it" },
  { id: "key", icon: "target", title: "Key Center", desc: "Find the home note of a melody" },
  { id: "inversions", icon: "tools", title: "Inversions", desc: "Root position, 1st, 2nd or 3rd inversion" },
  { id: "extended", icon: "star", title: "Extended Chords", desc: "9ths, sus, add9, 6ths, 11ths and 7♯9" },
  { id: "perfect", icon: "zoom", title: "Perfect Pitch", desc: "Name a note with no reference" },
  { id: "memory", icon: "bell", title: "Melody Memory", desc: "Repeat a melody that grows each round" },
];

export default function MelodyGames({ base, onOpenChange }: { base: number; onOpenChange?: (open: boolean) => void }) {
  const getCtx = useAudio();
  const [game, setGame] = useState<GameId | null>(null);
  const open = (g: GameId | null) => { setGame(g); onOpenChange?.(g !== null); };
  const props = { onExit: () => open(null), getCtx, base };
  if (game) {
    return (
      <div>
        <button type="button" onClick={() => open(null)} className="mb-6 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">← Back to melody games</button>
        <EarVisualizer />
        {game === "dictation" && <MelodicDictation {...props} />}
        {game === "scales" && <ScaleId {...props} />}
        {game === "progressions" && <Progressions {...props} />}
        {game === "bass" && <BassLine {...props} />}
        {game === "sing" && <SingInterval {...props} />}
        {game === "key" && <KeyCenter {...props} />}
        {game === "inversions" && <Inversions {...props} />}
        {game === "extended" && <Extended {...props} />}
        {game === "perfect" && <PerfectPitch {...props} />}
        {game === "memory" && <MelodyMemory {...props} />}
      </div>
    );
  }
  return (
    <div className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">More melody games</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((g) => (
          <button key={g.id} type="button" onClick={() => { getCtx(); open(g.id); }}
            className="p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left cursor-pointer">
            <div className="mb-2"><Icon3D name={g.icon} size={56} /></div>
            <h3 className="font-bold text-gray-900 mb-1">{g.title}</h3>
            <p className="text-sm text-gray-500">{g.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
