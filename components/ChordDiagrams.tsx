"use client";
import React from "react";

// ── Shared pitch helpers ─────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ── Piano keyboard diagram ───────────────────────────────────────────────────
// Renders one physical octave of a piano starting at the root's pitch class,
// highlighting whichever keys (by semitone offset from root) are in `intervals`.

const PIANO_PC: { white: boolean; xFrac: number }[] = [
  { white: true, xFrac: 0 },     // C
  { white: false, xFrac: 0.65 }, // C#
  { white: true, xFrac: 1 },     // D
  { white: false, xFrac: 1.75 }, // D#
  { white: true, xFrac: 2 },     // E
  { white: true, xFrac: 3 },     // F
  { white: false, xFrac: 3.5 },  // F#
  { white: true, xFrac: 4 },     // G
  { white: false, xFrac: 4.6 },  // G#
  { white: true, xFrac: 5 },     // A
  { white: false, xFrac: 5.75 }, // A#
  { white: true, xFrac: 6 },     // B
];

const midiOctave = (midi: number) => Math.floor(midi / 12) - 1;
const midiLabel = (midi: number) => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${midiOctave(midi)}`;

export function PianoDiagram({ root, intervals }: { root: number; intervals: readonly number[] }) {
  const rootPc = ((root % 12) + 12) % 12;
  const W = 48, BW = 31, WH = 140, BH = 86;
  const windowStartX = PIANO_PC[rootPc].xFrac;

  const keys = Array.from({ length: 12 }, (_, i) => {
    const pc = (rootPc + i) % 12;
    const info = PIANO_PC[pc];
    const octShift = rootPc + i >= 12 ? 7 : 0;
    const x = (info.xFrac + octShift - windowStartX) * W;
    return { i, pc, white: info.white, x, isTone: intervals.includes(i), isRoot: i === 0, label: midiLabel(root + i) };
  });

  const whites = keys.filter(k => k.white);
  const blacks = keys.filter(k => !k.white);
  const svgWidth = 7 * W;

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${WH + 4}`} style={{ maxWidth: svgWidth, margin: "0 auto", display: "block" }}>
      {whites.map(k => (
        <g key={k.i}>
          <rect x={k.x} y={0} width={W - 1} height={WH} rx={3}
            fill={k.isRoot ? "#7c3aed" : k.isTone ? "#c4b5fd" : "#fff"}
            stroke="#9ca3af" strokeWidth={1} />
          {k.isTone && (
            <text x={k.x + (W - 1) / 2} y={WH - 14} textAnchor="middle" fontSize={12} fontWeight={700}
              fill={k.isRoot ? "#fff" : "#4c1d95"}>
              {k.label}
            </text>
          )}
        </g>
      ))}
      {blacks.map(k => (
        <g key={k.i}>
          <rect x={k.x} y={0} width={BW} height={BH} rx={2}
            fill={k.isRoot ? "#7c3aed" : k.isTone ? "#a78bfa" : "#1f2937"}
            stroke="#111827" strokeWidth={1} />
          {k.isTone && (
            <text x={k.x + BW / 2} y={BH - 10} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">
              {k.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Staff notation diagram ───────────────────────────────────────────────────
// Renders the given notes (root + intervals, as absolute semitone offsets from
// root) stacked on a treble or bass staff, sharps-only spelling to match the
// rest of the app's note naming.

const PC_LETTER: { letter: string; acc: 0 | 1 }[] = [
  { letter: "C", acc: 0 }, { letter: "C", acc: 1 }, { letter: "D", acc: 0 }, { letter: "D", acc: 1 },
  { letter: "E", acc: 0 }, { letter: "F", acc: 0 }, { letter: "F", acc: 1 }, { letter: "G", acc: 0 },
  { letter: "G", acc: 1 }, { letter: "A", acc: 0 }, { letter: "A", acc: 1 }, { letter: "B", acc: 0 },
];
const LETTER_ORDER = ["C", "D", "E", "F", "G", "A", "B"];

function diatonicIndex(letter: string, octave: number) {
  return octave * 7 + LETTER_ORDER.indexOf(letter);
}

function midiInfo(midi: number) {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const { letter, acc } = PC_LETTER[pc];
  return { letter, acc, octave, diatonic: diatonicIndex(letter, octave) };
}

function ledgerSteps(step: number): number[] {
  const out: number[] = [];
  if (step < 0) {
    const start = step % 2 === 0 ? step : step - 1;
    for (let e = -2; e >= start; e -= 2) out.push(e);
  } else if (step > 8) {
    const start = step % 2 === 0 ? step : step + 1;
    for (let e = 10; e <= start; e += 2) out.push(e);
  }
  return out;
}

export function SheetMusic({ root, intervals }: { root: number; intervals: readonly number[] }) {
  const clef: "treble" | "bass" = root < 60 ? "bass" : "treble";
  const bottomLine = clef === "treble" ? diatonicIndex("E", 4) : diatonicIndex("G", 2);

  const notes = intervals
    .map(iv => root + iv)
    .map(midi => {
      const info = midiInfo(midi);
      return { midi, ...info, step: info.diatonic - bottomLine };
    })
    .sort((a, b) => a.step - b.step);

  const LS = 12; // px between adjacent staff lines
  const staffBottomY = 150;
  const noteX0 = 110;
  let prevStep: number | null = null;
  let toggled = false;
  const positioned = notes.map(n => {
    const overlap = prevStep !== null && Math.abs(n.step - prevStep) <= 1;
    toggled = overlap ? !toggled : false;
    prevStep = n.step;
    return { ...n, x: noteX0 + (toggled ? 16 : 0), y: staffBottomY - n.step * (LS / 2) };
  });

  const width = 280, height = 220;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: 340, margin: "0 auto", display: "block" }}>
      {[0, 1, 2, 3, 4].map(k => (
        <line key={k} x1={40} x2={width - 20} y1={staffBottomY - k * LS} y2={staffBottomY - k * LS} stroke="#374151" strokeWidth={1.5} />
      ))}
      <text x={44} y={clef === "treble" ? staffBottomY - LS * 1.1 : staffBottomY - LS * 3.2} fontSize={clef === "treble" ? 56 : 32} fill="#111827">
        {clef === "treble" ? "\u{1D11E}" : "\u{1D122}"}
      </text>
      {positioned.flatMap(n => ledgerSteps(n.step).map(e => (
        <line key={`${n.midi}-${e}`} x1={n.x - 13} x2={n.x + 13} y1={staffBottomY - e * (LS / 2)} y2={staffBottomY - e * (LS / 2)} stroke="#374151" strokeWidth={1.5} />
      )))}
      {positioned.map(n => (
        <g key={n.midi}>
          {n.acc === 1 && <text x={n.x - 19} y={n.y + 5} fontSize={16} fill="#111827">{"♯"}</text>}
          <ellipse cx={n.x} cy={n.y} rx={7} ry={5.2} fill="#111827" transform={`rotate(-18 ${n.x} ${n.y})`} />
        </g>
      ))}
    </svg>
  );
}
