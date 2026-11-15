// 3D icons from 3dicons.co (CC0), served from /public/icons3d. They're on a
// white background; multiply blending lets that disappear on tinted cards too.
export type Icon3DName =
  | "bell" | "clock" | "computer" | "file-text" | "flag" | "folder" | "headphone" | "link" | "mic" | "mobile"
  | "notebook" | "pencil" | "picture" | "puzzle" | "rocket" | "shield" | "star" | "target" | "thumb-up" | "tools" | "zoom";

export default function Icon3D({ name, size = 64, className = "" }: { name: Icon3DName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons3d/${name}.webp`} alt="" width={size} height={size} loading="lazy" className={className}
      style={{ width: size, height: size, mixBlendMode: "multiply", objectFit: "contain" }} />
  );
}

// Which icon each music tool uses (by route)
export const TOOL_ICONS: Record<string, Icon3DName> = {
  "/Split-Sheet-Generator": "file-text",
  "/Key-Finder": "zoom",
  "/BPM-Calculator": "rocket",
  "/Reverb-and-Delay-Calculator": "puzzle",
  "/Synthfluanto": "computer",
  "/Ear-Training": "headphone",
  "/Tuner": "target",
  "/Metronome": "clock",
  "/LUFS-Meter": "mic",
  "/WAV-to-MP3": "folder",
  "/MP4-to-MOV": "mobile",
  "/Link-Shortener": "link",
  "/Metadata-Editor": "pencil",
  "/Image-Privacy": "shield",
};
