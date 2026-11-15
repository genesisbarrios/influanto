"use client";
// A shared audio output for the ear-training games, plus a waveform that shows
// whatever they're playing. Games connect their sounds to audioOut(ctx)
// instead of ctx.destination; the waveform reads the same analyser.
import { useEffect, useRef } from "react";

const TURQUOISE = "#09ecf3"; // logo / primary
const DARK_BLUE = "#2e5596"; // site header blue

const chains = new WeakMap<BaseAudioContext, { out: GainNode; analyser: AnalyserNode }>();
let current: AnalyserNode | null = null;

export function audioOut(ctx: AudioContext): AudioNode {
  let c = chains.get(ctx);
  if (!c) {
    const out = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    out.connect(analyser);
    analyser.connect(ctx.destination);
    c = { out, analyser };
    chains.set(ctx, c);
  }
  current = c.analyser;
  return c.out;
}

export default function EarVisualizer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvas.current!;
    const g = cv.getContext("2d")!;
    let raf = 0, level = 0, gain = 1;
    let data = new Uint8Array(2048);
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      let peak = 0;
      if (current) {
        if (data.length !== current.fftSize) data = new Uint8Array(current.fftSize);
        current.getByteTimeDomainData(data);
        for (let i = 0; i < data.length; i += 8) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
      }
      level += (Math.min(1, peak * 2.5) - level) * 0.2; // eased, so it glows in and settles out
      // auto-scale: quiet sounds (short drum hits) still fill the bar, but never blow past it
      gain += (Math.min(4, 0.6 / Math.max(peak, 0.03)) - gain) * 0.08;
      const grad = g.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, DARK_BLUE);
      grad.addColorStop(0.5, TURQUOISE);
      grad.addColorStop(1, DARK_BLUE);
      g.lineWidth = 2;
      g.strokeStyle = grad;
      g.shadowColor = TURQUOISE;
      g.shadowBlur = 8 * level;
      g.globalAlpha = 0.35 + 0.65 * level;
      g.beginPath();
      const n = 256;
      for (let k = 0; k <= n; k++) {
        const i = Math.floor((k / n) * (data.length - 1));
        const v = current ? (data[i] - 128) / 128 : 0;
        const x = (k / n) * W, y = H / 2 + Math.tanh(v * gain) * (H / 2 - 3); // tanh: rounds off peaks instead of clipping flat
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="rounded-2xl mb-6 px-3 py-2" style={{ background: "linear-gradient(90deg, #1f3d73, #2e5596 50%, #1f3d73)" }} aria-hidden="true">
      <canvas ref={canvas} className="w-full block" style={{ height: 56 }} />
    </div>
  );
}
