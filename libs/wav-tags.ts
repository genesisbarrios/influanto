// Minimal WAV (RIFF) metadata via the standard LIST/INFO chunk.
// WAV has no standard cover-art or URL field, so those are not written here.

export interface WavTags {
  title?: string; artist?: string; album?: string; composer?: string;
  year?: string; genre?: string; copyright?: string; comment?: string;
}

// RIFF INFO fourCC <-> our field names
const FIELD_TO_CC: [keyof WavTags, string][] = [
  ["title", "INAM"], ["artist", "IART"], ["album", "IPRD"], ["composer", "IENG"],
  ["year", "ICRD"], ["genre", "IGNR"], ["copyright", "ICOP"], ["comment", "ICMT"],
];
const CC_TO_FIELD: Record<string, keyof WavTags> = Object.fromEntries(FIELD_TO_CC.map(([f, c]) => [c, f]));

const str = (view: DataView, off: number, len: number) => {
  let s = ""; for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(off + i)); return s;
};

export function readWavTags(buffer: ArrayBuffer): WavTags {
  const out: WavTags = {};
  try {
    const view = new DataView(buffer);
    if (str(view, 0, 4) !== "RIFF" || str(view, 8, 4) !== "WAVE") return out;
    let off = 12;
    while (off + 8 <= buffer.byteLength) {
      const id = str(view, off, 4);
      const size = view.getUint32(off + 4, true);
      const dataStart = off + 8;
      if (id === "LIST" && str(view, dataStart, 4) === "INFO") {
        let p = dataStart + 4;
        const end = dataStart + size;
        while (p + 8 <= end) {
          const cc = str(view, p, 4);
          const sz = view.getUint32(p + 4, true);
          const text = new TextDecoder().decode(new Uint8Array(buffer.slice(p + 8, p + 8 + sz))).replace(/\0+$/, "");
          if (CC_TO_FIELD[cc]) out[CC_TO_FIELD[cc]] = text;
          p += 8 + sz + (sz % 2);
        }
      }
      off = dataStart + size + (size % 2);
    }
  } catch { /* ignore */ }
  return out;
}

function infoSubchunk(cc: string, text: string): Uint8Array {
  const strBytes = new TextEncoder().encode(text);
  const dataLen = strBytes.length + 1;            // include null terminator
  const padded = dataLen + (dataLen % 2);
  const buf = new Uint8Array(8 + padded);
  for (let i = 0; i < 4; i++) buf[i] = cc.charCodeAt(i);
  buf[4] = dataLen & 0xff; buf[5] = (dataLen >> 8) & 0xff; buf[6] = (dataLen >> 16) & 0xff; buf[7] = (dataLen >> 24) & 0xff;
  buf.set(strBytes, 8);
  return buf;
}

export function writeWavTags(buffer: ArrayBuffer, tags: WavTags): Blob {
  const view = new DataView(buffer);
  if (str(view, 0, 4) !== "RIFF" || str(view, 8, 4) !== "WAVE") throw new Error("Not a valid WAV file");

  // Keep every top-level chunk except an existing LIST/INFO
  const kept: Uint8Array[] = [];
  let off = 12;
  while (off + 8 <= buffer.byteLength) {
    const id = str(view, off, 4);
    const size = view.getUint32(off + 4, true);
    const dataStart = off + 8;
    if (dataStart + size > buffer.byteLength) break;
    const isInfo = id === "LIST" && str(view, dataStart, 4) === "INFO";
    const total = 8 + size + (size % 2);
    if (!isInfo) kept.push(new Uint8Array(buffer.slice(off, off + total)));
    off = dataStart + size + (size % 2);
  }

  // Build the new LIST/INFO chunk
  const subs: Uint8Array[] = [];
  for (const [field, cc] of FIELD_TO_CC) {
    const v = (tags[field] || "").trim();
    if (v) subs.push(infoSubchunk(cc, v));
  }
  let listChunk = new Uint8Array(0);
  if (subs.length) {
    const subsLen = subs.reduce((n, s) => n + s.length, 0);
    const infoLen = 4 + subsLen;                  // "INFO" + subchunks
    listChunk = new Uint8Array(8 + infoLen);
    listChunk.set([0x4c, 0x49, 0x53, 0x54], 0);   // "LIST"
    listChunk[4] = infoLen & 0xff; listChunk[5] = (infoLen >> 8) & 0xff; listChunk[6] = (infoLen >> 16) & 0xff; listChunk[7] = (infoLen >> 24) & 0xff;
    listChunk.set([0x49, 0x4e, 0x46, 0x4f], 8);   // "INFO"
    let p = 12; for (const s of subs) { listChunk.set(s, p); p += s.length; }
  }

  const bodyLen = kept.reduce((n, c) => n + c.length, 0) + listChunk.length;
  const out = new Uint8Array(12 + bodyLen);
  out.set([0x52, 0x49, 0x46, 0x46], 0);           // "RIFF"
  const riffSize = 4 + bodyLen;                    // "WAVE" + body
  out[4] = riffSize & 0xff; out[5] = (riffSize >> 8) & 0xff; out[6] = (riffSize >> 16) & 0xff; out[7] = (riffSize >> 24) & 0xff;
  out.set([0x57, 0x41, 0x56, 0x45], 8);           // "WAVE"
  let q = 12;
  for (const c of kept) { out.set(c, q); q += c.length; }
  if (listChunk.length) { out.set(listChunk, q); q += listChunk.length; }

  return new Blob([out], { type: "audio/wav" });
}
