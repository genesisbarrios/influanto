// 3D icons from 3dicons.co (CC0) and, for the drum, Microsoft Fluent Emoji 3D
// (MIT), served from /public/icons3d. The 3dicons ones are on a white background;
// multiply blending lets that disappear on tinted cards too.
export type Icon3DName =
  | "bell" | "clock" | "computer" | "drum" | "file-text" | "flag" | "folder" | "headphone" | "link" | "mic" | "mobile"
  | "notebook" | "pencil" | "picture" | "puzzle" | "rocket" | "shield" | "star" | "target" | "thumb-up" | "tools" | "zoom";

export default function Icon3D({ name, size = 64, className = "" }: { name: Icon3DName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons3d/${name}.${name === "drum" ? "png" : "webp"}`} alt="" width={size} height={size} loading="lazy" className={className}
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
  "/YouTube-Downloader": "thumb-up",
  "/Link-Shortener": "link",
  "/Metadata-Editor": "pencil",
  "/Image-Privacy": "shield",
};
