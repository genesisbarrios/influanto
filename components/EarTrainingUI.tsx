"use client";
// Building blocks shared by the ear-training games (rhythm and melody):
// option pills, answer grids, game cards, session scoring and results.
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

export const accColor = (pct: number) => (pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626");
export const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
export const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Shared UI ─────────────────────────────────────────────────────────────────

export function Pills<T extends string | number>({ label, options, value, onChange, disabled }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="flex justify-center items-center gap-2 mb-5 flex-wrap">
      <span className="text-xs font-medium text-gray-400 mr-1">{label}:</span>
      {options.map((o) => (
        <button key={String(o.id)} type="button" disabled={disabled} onClick={() => onChange(o.id)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all ${value === o.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
export const LEVELS = [1, 2, 3, 4].map((l) => ({ id: l, label: `Lvl ${l}` }));

export function ChoiceGrid({ choices, answer, selected, onPick, render }: { choices: string[]; answer: string; selected: string | null; onPick: (c: string) => void; render?: (c: string) => React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {choices.map((c) => {
        let cls = "p-4 rounded-xl border-2 font-semibold text-sm transition-all ";
        if (selected === null) cls += "bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";
        else if (c === answer) cls += "bg-green-50 border-green-500 text-green-700 cursor-default";
        else if (c === selected) cls += "bg-red-50 border-red-400 text-red-700 cursor-default";
        else cls += "bg-white border-gray-200 text-gray-400 cursor-default";
        return <button key={c} type="button" className={cls} onClick={() => selected === null && onPick(c)}>{render ? render(c) : c}</button>;
      })}
    </div>
  );
}

export function GameCard({ title, round, rounds, children }: { title: string; round: number; rounds: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm font-medium text-gray-500">{Math.min(round, rounds)}/{rounds}</span>
      </div>
      {children}
    </div>
  );
}

export function SessionDone({ title, score, rounds, onAgain, onExit }: { title: string; score: number; rounds: number; onAgain: () => void; onExit: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <div className="text-5xl mb-4 text-yellow-500"><FontAwesomeIcon icon={faTrophy} /></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Session Complete!</h2>
      <p className="text-gray-500 text-sm mb-6">{title} · {rounds} rounds</p>
      <p className="text-4xl font-black mb-8" style={{ color: accColor(score) }}>{score}%</p>
      <div className="flex justify-center gap-3">
        <button type="button" onClick={onAgain} className="btn btn-primary btn-sm">Play Again</button>
        <button type="button" onClick={onExit} className="btn btn-outline btn-sm">Change Game</button>
      </div>
    </div>
  );
}

// Session bookkeeping shared by every game: rounds played and the running score.
// `done`: every round played; `finished`: the player has moved on to the results.
export function useSession(rounds: number) {
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const add = (s: number) => { setScores((x) => [...x, s]); setRound((x) => x + 1); };
  const reset = () => { setRound(0); setScores([]); setFinished(false); };
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return { round, scores, add, reset, avg, done: round >= rounds, finished, finish: () => setFinished(true) };
}

export function NextLine({ ok, wrong, onNext, label, s }: { ok: boolean; wrong: string; onNext: () => void; label: string; s: { done: boolean; finish: () => void } }) {
  return (
    <div className="text-center mt-2">
      <p className={`font-bold mb-3 ${ok ? "text-green-600" : "text-red-500"}`}>{ok ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" /> Correct!</> : wrong}</p>
      <button type="button" onClick={s.done ? s.finish : onNext} className="btn btn-primary btn-sm">{s.done ? "See Results" : label}</button>
    </div>
  );
}

