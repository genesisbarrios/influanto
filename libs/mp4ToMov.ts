// MP4 -> MOV without re-encoding. MP4 and MOV share the same box structure,
// so the conversion rewrites the file-type box to QuickTime ("qt  ") and keeps
// every other byte. The ftyp box keeps its exact size, so the sample offsets
// stored in the file stay valid. Works on any file size: only box headers and
// the movie header (moov) are read into memory.

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "dinf"]);

// Sample-entry codes QuickTime Player / Final Cut / iMovie can play from a .mov
const MOV_FRIENDLY = new Set(["avc1", "avc3", "hvc1", "mp4a", "ap4h", "apch", "apcn", "apcs", "apco", "ac-3", "ec-3", "alac", "lpcm", "sowt", "twos", "jpeg", "mp4v", "tx3g", "text", "c608", "tmcd"]);

const CODEC_NAMES: Record<string, string> = {
  avc1: "H.264", avc3: "H.264", hvc1: "HEVC (H.265)", hev1: "HEVC (H.265, hev1)", av01: "AV1", vp09: "VP9", vp08: "VP8",
  mp4a: "AAC", Opus: "Opus", "ac-3": "Dolby Digital", "ec-3": "Dolby Digital Plus", alac: "Apple Lossless", fLaC: "FLAC", mp4v: "MPEG-4 Visual",
  ap4h: "ProRes 4444", apch: "ProRes 422 HQ", apcn: "ProRes 422", apcs: "ProRes 422 LT", apco: "ProRes 422 Proxy",
};

export type Mp4Info = { codecs: string[]; unsupported: string[] };
export class NotMp4Error extends Error {}

type Box = { type: string; start: number; headerSize: number; size: number };

const fourcc = (v: DataView, at: number) => String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));

async function readBoxAt(file: Blob, at: number): Promise<Box | null> {
  if (at + 8 > file.size) return null;
  const v = new DataView(await file.slice(at, Math.min(at + 16, file.size)).arrayBuffer());
  let size = v.getUint32(0);
  const type = fourcc(v, 4);
  let headerSize = 8;
  if (size === 1) {
    if (v.byteLength < 16) return null;
    size = Number(v.getBigUint64(8));
    headerSize = 16;
  } else if (size === 0) {
    size = file.size - at;
  }
  if (size < headerSize) return null;
  return { type, start: at, headerSize, size };
}

// Sample entries listed in every stsd inside the movie header
function sampleEntries(moov: DataView): string[] {
  const out: string[] = [];
  const walk = (from: number, to: number) => {
    let p = from;
    while (p + 8 <= to) {
      let size = moov.getUint32(p);
      const type = fourcc(moov, p + 4);
      let hdr = 8;
      if (size === 1) { size = Number(moov.getBigUint64(p + 8)); hdr = 16; }
      else if (size === 0) size = to - p;
      if (size < hdr || p + size > to) break;
      if (CONTAINERS.has(type)) walk(p + hdr, p + size);
      else if (type === "stsd" && p + 16 <= to) {
        const count = moov.getUint32(p + 12);
        let e = p + 16;
        for (let i = 0; i < count && e + 8 <= p + size; i++) {
          out.push(fourcc(moov, e + 4));
          e += moov.getUint32(e) || 8;
        }
      }
      p += size;
    }
  };
  walk(0, moov.byteLength);
  return out;
}

export async function inspectMp4(file: Blob): Promise<{ ftyp: Box; info: Mp4Info }> {
  let ftyp: Box | null = null;
  let moov: Box | null = null;
  let at = 0;
  for (let guard = 0; guard < 10000; guard++) {
    const box = await readBoxAt(file, at);
    if (!box) break;
    if (box.type === "ftyp" && !ftyp) ftyp = box;
    if (box.type === "moov") moov = box;
    at = box.start + box.size;
  }
  if (!ftyp || !moov) throw new NotMp4Error("This doesn't look like an MP4 video.");
  const body = new DataView(await file.slice(moov.start + moov.headerSize, moov.start + moov.size).arrayBuffer());
  const types = Array.from(new Set(sampleEntries(body)));
  return {
    ftyp,
    info: {
      codecs: types.map((t) => CODEC_NAMES[t] || t),
      unsupported: types.filter((t) => !MOV_FRIENDLY.has(t)).map((t) => CODEC_NAMES[t] || t),
    },
  };
}

export async function mp4ToMov(file: Blob): Promise<{ blob: Blob; info: Mp4Info }> {
  const { ftyp, info } = await inspectMp4(file);
  const bytes = new Uint8Array(await file.slice(ftyp.start, ftyp.start + ftyp.size).arrayBuffer());
  const v = new DataView(bytes.buffer);
  const qt = [0x71, 0x74, 0x20, 0x20]; // "qt  "
  const body = ftyp.headerSize;
  bytes.set(qt, body); // major brand
  v.setUint32(body + 4, 0x00000200); // minor version
  for (let p = body + 8; p + 4 <= bytes.length; p += 4) bytes.set(qt, p); // compatible brands
  const blob = new Blob([file.slice(0, ftyp.start), bytes, file.slice(ftyp.start + ftyp.size)], { type: "video/quicktime" });
  return { blob, info };
}
