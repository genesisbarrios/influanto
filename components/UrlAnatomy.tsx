// A small "URL anatomy" strip that highlights where an artist ID sits inside
// a real platform URL — used in place of a screenshot (which we can't embed
// from Spotify/Apple/etc's own UI) to show exactly what to copy.
export default function UrlAnatomy({ before, id, after = "" }: { before: string; id: string; after?: string }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: "0.82rem",
        background: "#111827",
        color: "#cbd5e1",
        borderRadius: 10,
        padding: "14px 16px",
        overflowX: "auto",
        whiteSpace: "nowrap",
      }}
    >
      <span>{before}</span>
      <span
        style={{
          background: "#4f46e5",
          color: "#fff",
          padding: "2px 7px",
          borderRadius: 5,
          fontWeight: 700,
        }}
      >
        {id}
      </span>
      <span>{after}</span>
    </div>
  );
}
