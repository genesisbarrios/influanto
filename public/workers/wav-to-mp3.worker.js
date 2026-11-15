/* eslint-disable no-undef */
// Encodes PCM to MP3 off the main thread for the WAV to MP3 converter.
// In:  { channels: Float32Array[], sampleRate, kbps }
// Out: { type: "progress", value } ... then { type: "done", parts: Uint8Array[] }
importScripts("/vendor/lame.min.js");

const BLOCK = 1152;

function toInt16(f32) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

self.onmessage = (e) => {
  try {
    const { channels, sampleRate, kbps } = e.data;
    const left = toInt16(channels[0]);
    const right = channels.length > 1 ? toInt16(channels[1]) : null;
    const encoder = new lamejs.Mp3Encoder(right ? 2 : 1, sampleRate, kbps);
    const parts = [];
    const total = left.length;
    let lastReport = 0;
    for (let i = 0; i < total; i += BLOCK) {
      const l = left.subarray(i, i + BLOCK);
      const buf = right ? encoder.encodeBuffer(l, right.subarray(i, i + BLOCK)) : encoder.encodeBuffer(l);
      if (buf.length) parts.push(new Uint8Array(buf));
      if (i - lastReport > total / 100) {
        lastReport = i;
        self.postMessage({ type: "progress", value: i / total });
      }
    }
    const end = encoder.flush();
    if (end.length) parts.push(new Uint8Array(end));
    self.postMessage({ type: "done", parts });
  } catch (err) {
    self.postMessage({ type: "error", message: String((err && err.message) || err) });
  }
};
