// Loudness measurement per ITU-R BS.1770-4 / EBU R128 (Tech 3341, 3342).
// Pure functions on Float32Array channel data, safe for the browser or Node.
//
//   K-weighting  two biquads per channel: a high-shelf "pre-filter" (head
//                effects) and the RLB high-pass, designed for any sample rate
//                (same formulas as libebur128).
//   Momentary    400 ms windows, every 100 ms
//   Short-term   3 s windows, every 100 ms
//   Integrated   400 ms blocks gated at -70 LUFS absolute, then -10 LU
//                below the ungated mean (relative gate)
//   LRA          short-term values gated at -70 LUFS and -20 LU relative;
//                95th minus 10th percentile (EBU Tech 3342)
//   True peak    4x oversampled peak (BS.1770 Annex 2), in dBTP

export interface LoudnessResult {
  integrated: number; // LUFS (-Infinity for silence)
  momentaryMax: number; // LUFS
  shortTermMax: number; // LUFS
  lra: number; // LU
  truePeak: number; // dBTP
  samplePeak: number; // dBFS
  momentary: Float32Array; // per 100 ms step, LUFS
  shortTerm: Float32Array; // per 100 ms step, LUFS
  stepSeconds: number; // 0.1
  duration: number; // seconds
  sampleRate: number;
  channels: number;
}

const ABS_GATE = -70;
const STEP_S = 0.1;

const lufs = (energy: number) => (energy > 0 ? -0.691 + 10 * Math.log10(energy) : -Infinity);

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

export function kWeightingFilters(fs: number): [Biquad, Biquad] {
  // Stage 1: high shelf
  const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
  const K = Math.tan((Math.PI * f0) / fs);
  const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416);
  const a0 = 1 + K / Q + K * K;
  const shelf: Biquad = {
    b0: (Vh + (Vb * K) / Q + K * K) / a0,
    b1: (2 * (K * K - Vh)) / a0,
    b2: (Vh - (Vb * K) / Q + K * K) / a0,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };
  // Stage 2: RLB high-pass
  const f1 = 38.13547087602444, Q1 = 0.5003270373238773;
  const K1 = Math.tan((Math.PI * f1) / fs);
  const d = 1 + K1 / Q1 + K1 * K1;
  const hp: Biquad = { b0: 1, b1: -2, b2: 1, a1: (2 * (K1 * K1 - 1)) / d, a2: (1 - K1 / Q1 + K1 * K1) / d };
  return [shelf, hp];
}

// BS.1770 channel weights for the usual 5.1 order (L R C LFE Ls Rs); LFE is excluded.
function channelWeight(index: number, channels: number): number {
  if (channels < 6) return 1;
  if (index === 3) return 0;
  return index >= 4 ? 1.41 : 1;
}

/** Energy of K-weighted samples in each 100 ms step, per channel. */
function stepEnergies(data: Float32Array, fs: number, steps: number, stepLen: number): Float64Array {
  const [s, h] = kWeightingFilters(fs);
  const out = new Float64Array(steps);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0; // shelf state
  let u1 = 0, u2 = 0, z1 = 0, z2 = 0; // high-pass state
  for (let k = 0; k < steps; k++) {
    let sum = 0;
    const end = Math.min(data.length, (k + 1) * stepLen);
    for (let i = k * stepLen; i < end; i++) {
      const x = data[i];
      const y = s.b0 * x + s.b1 * x1 + s.b2 * x2 - s.a1 * y1 - s.a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      const z = h.b0 * y + h.b1 * u1 + h.b2 * u2 - h.a1 * z1 - h.a2 * z2;
      u2 = u1; u1 = y; z2 = z1; z1 = z;
      sum += z * z;
    }
    out[k] = sum;
  }
  return out;
}

// 4x oversampling interpolator: 48-tap windowed sinc split into 4 phases.
const OS = 4, TAPS_PER_PHASE = 12;
const PHASES: Float64Array[] = (() => {
  const n = OS * TAPS_PER_PHASE;
  const taps = new Float64Array(n);
  const c = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    const t = (i - c) / OS;
    const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / n); // Hann
    taps[i] = sinc * w;
  }
  return [...Array(OS)].map((_, p) => {
    const ph = new Float64Array(TAPS_PER_PHASE);
    let sum = 0;
    for (let k = 0; k < TAPS_PER_PHASE; k++) { ph[k] = taps[k * OS + p]; sum += ph[k]; }
    for (let k = 0; k < TAPS_PER_PHASE; k++) ph[k] /= sum; // unity gain per phase
    return ph;
  });
})();

function peaks(data: Float32Array, fs: number): { sample: number; truePeak: number } {
  let sample = 0;
  for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > sample) sample = a; }
  if (fs >= 176400) return { sample, truePeak: sample }; // already oversampled
  // Only samples near the loudest regions can produce the true peak; still,
  // interpolating everything is simple and fast enough for a song.
  let tp = sample;
  const n = data.length;
  for (let i = TAPS_PER_PHASE; i < n; i++) {
    for (let p = 1; p < OS; p++) {
      const ph = PHASES[p];
      let acc = 0;
      for (let k = 0; k < TAPS_PER_PHASE; k++) acc += ph[k] * data[i - k];
      const a = acc < 0 ? -acc : acc;
      if (a > tp) tp = a;
    }
  }
  return { sample, truePeak: tp };
}

const dB = (a: number) => (a > 0 ? 20 * Math.log10(a) : -Infinity);

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[i];
}

/** Full analysis. `channels` are the decoded channel buffers. */
export function measureLoudness(channels: Float32Array[], sampleRate: number): LoudnessResult {
  const stepLen = Math.round(sampleRate * STEP_S);
  const length = channels[0]?.length ?? 0;
  const steps = Math.ceil(length / stepLen);

  // Weighted per-step energy summed over channels (sum of G_i * z_i)
  const energy = new Float64Array(steps);
  let samplePeak = 0, truePeak = 0;
  channels.forEach((ch, i) => {
    const w = channelWeight(i, channels.length);
    if (w) {
      const e = stepEnergies(ch, sampleRate, steps, stepLen);
      for (let k = 0; k < steps; k++) energy[k] += w * e[k];
    }
    const p = peaks(ch, sampleRate);
    samplePeak = Math.max(samplePeak, p.sample);
    truePeak = Math.max(truePeak, p.truePeak);
  });

  // Mean square over a window of `n` steps ending at step k
  const window = (n: number) => {
    const out = new Float32Array(steps);
    const z = new Float64Array(steps);
    let acc = 0;
    for (let k = 0; k < steps; k++) {
      acc += energy[k];
      if (k >= n) acc -= energy[k - n];
      const len = Math.min(k + 1, n) * stepLen;
      z[k] = acc / len;
      out[k] = lufs(z[k]);
    }
    return { lufs: out, z };
  };
  const M = window(4); // 400 ms
  const S = window(30); // 3 s

  // Integrated: gating over 400 ms blocks (every 100 ms, 75 % overlap).
  // Blocks shorter than 400 ms at the very start are skipped.
  const blocks: number[] = [];
  for (let k = 3; k < steps; k++) blocks.push(M.z[k]);
  const absGated = blocks.filter((z) => lufs(z) > ABS_GATE);
  let integrated = -Infinity;
  if (absGated.length) {
    const rel = lufs(absGated.reduce((a, b) => a + b, 0) / absGated.length) - 10;
    const gated = absGated.filter((z) => lufs(z) > rel);
    if (gated.length) integrated = lufs(gated.reduce((a, b) => a + b, 0) / gated.length);
  }

  // LRA from short-term values (only complete 3 s windows)
  const st: number[] = [];
  for (let k = 29; k < steps; k++) st.push(S.z[k]);
  const stAbs = st.filter((z) => lufs(z) > ABS_GATE);
  let lra = 0;
  if (stAbs.length) {
    const rel = lufs(stAbs.reduce((a, b) => a + b, 0) / stAbs.length) - 20;
    const vals = stAbs.map(lufs).filter((l) => l > rel).sort((a, b) => a - b);
    lra = percentile(vals, 95) - percentile(vals, 10);
  }

  let mMax = -Infinity, sMax = -Infinity;
  for (let k = 3; k < steps; k++) if (M.lufs[k] > mMax) mMax = M.lufs[k];
  for (let k = 29; k < steps; k++) if (S.lufs[k] > sMax) sMax = S.lufs[k];
  if (steps < 30) for (let k = 0; k < steps; k++) if (S.lufs[k] > sMax) sMax = S.lufs[k]; // clips under 3 s

  return {
    integrated,
    momentaryMax: mMax,
    shortTermMax: sMax,
    lra,
    truePeak: dB(truePeak),
    samplePeak: dB(samplePeak),
    momentary: M.lufs,
    shortTerm: S.lufs,
    stepSeconds: STEP_S,
    duration: length / sampleRate,
    sampleRate,
    channels: channels.length,
  };
}

// Typical normalization targets (integrated LUFS). Services change these and
// some let listeners pick other levels; shown as a guide.
export const STREAMING_TARGETS: { name: string; lufs: number; peak: number }[] = [
  { name: "Spotify", lufs: -14, peak: -1 },
  { name: "Apple Music", lufs: -16, peak: -1 },
  { name: "YouTube", lufs: -14, peak: -1 },
  { name: "TIDAL", lufs: -14, peak: -1 },
  { name: "Amazon Music", lufs: -14, peak: -2 },
  { name: "Deezer", lufs: -15, peak: -1 },
];
