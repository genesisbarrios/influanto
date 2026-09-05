"use client";
/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import apiClient from "@/libs/api";
import ImagePicker from "@/components/ImagePicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faShareNodes } from "@fortawesome/free-solid-svg-icons";

interface Props {
  user: any;
  setUser: (updater: (prev: any) => any) => void;
}

const CARD_W = 640;
const CARD_H = 1000;
const RENDER_SCALE = 2; // draw at 2x for a crisp downloaded PNG

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(src: string, crossOrigin?: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Auto-pick legible text color against the user's chosen background.
function pickTextColor(hex: string): string {
  const c = (hex || "#4f46e5").replace("#", "");
  const full = c.length === 3 ? c.split("").map(ch => ch + ch).join("") : c;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#14141c" : "#ffffff";
}

export default function BusinessCard({ user, setUser }: Props) {
  const saved = user?.businessCard || {};
  const [displayName, setDisplayName] = useState<string>(saved.displayName || user?.username || "");
  const [bgColor, setBgColor] = useState<string>(saved.bgColor || "#4f46e5");
  const [avatar, setAvatar] = useState<string>(saved.avatar ?? user?.image ?? "");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlertRaw] = useState("");
  const [alertOk, setAlertOk] = useState(false);
  const setAlert = (msg: string, ok = false) => { setAlertRaw(msg); setAlertOk(ok); };
  const [rendering, setRendering] = useState(false);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const QRCodeStylingRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/my-images").then(r => r.json()).then(j => setGalleryImages(Array.isArray(j?.images) ? j.images : [])).catch(() => {});
    import("qr-code-styling").then(mod => { QRCodeStylingRef.current = mod.default || mod; redraw(); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { redraw(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [displayName, bgColor, avatar, user?.username]);

  const redraw = async () => {
    const canvas = canvasRef.current;
    const QRCodeStyling = QRCodeStylingRef.current;
    if (!canvas || !QRCodeStyling || !user?.username) return;
    setRendering(true);
    try {
      canvas.width = CARD_W * RENDER_SCALE;
      canvas.height = CARD_H * RENDER_SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.clearRect(0, 0, CARD_W, CARD_H);

      ctx.save();
      roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 36);
      ctx.clip();
      ctx.fillStyle = bgColor || "#4f46e5";
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      const textColor = pickTextColor(bgColor);

      // ── Logo pill, top-left ──
      try {
        const logo = await loadImage("/TRANSPARENT_LOGO.png");
        const pillX = 40, pillY = 40, pillW = 168, pillH = 48;
        ctx.fillStyle = "#14141c";
        roundRectPath(ctx, pillX, pillY, pillW, pillH, 24);
        ctx.fill();
        const logoH = 20, logoW = logoH * (logo.width / logo.height);
        ctx.drawImage(logo, pillX + (pillW - logoW) / 2, pillY + (pillH - logoH) / 2, logoW, logoH);
      } catch {}

      // ── Avatar (optional) ──
      let cursorY = 260;
      if (avatar) {
        try {
          // Routed through our own origin so a source without permissive CORS
          // headers (e.g. a Google account photo) never taints the canvas —
          // a tainted canvas silently fails every future toBlob()/download.
          const avImg = await loadImage(`/api/image-proxy?url=${encodeURIComponent(avatar)}`);
          const size = 176, cx = CARD_W / 2, cy = 230 + size / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          drawImageCover(ctx, avImg, cx - size / 2, cy - size / 2, size, size);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = textColor + "40";
          ctx.stroke();
          cursorY = cy + size / 2 + 56;
        } catch {
          cursorY = 300;
        }
      } else {
        cursorY = 300;
      }

      // ── Name + URL ──
      ctx.textAlign = "center";
      ctx.fillStyle = textColor;
      ctx.font = "700 42px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(displayName || user.username, CARD_W / 2, cursorY, CARD_W - 80);

      ctx.font = "500 22px 'Helvetica Neue', Arial, sans-serif";
      ctx.globalAlpha = 0.78;
      ctx.fillText(`influanto.com/${user.username}`, CARD_W / 2, cursorY + 38);
      ctx.globalAlpha = 1;

      // ── QR code, bottom ──
      const qr = new QRCodeStyling({
        width: 560,
        height: 560,
        type: "canvas",
        data: `https://influanto.com/${user.username}`,
        margin: 0,
        dotsOptions: { color: "#14141c", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "extra-rounded", color: "#14141c" },
        cornersDotOptions: { type: "dot", color: "#14141c" },
      });
      const blob = (await qr.getRawData("png")) as Blob | null;
      if (blob) {
        const url = URL.createObjectURL(blob);
        try {
          const qrImg = await loadImage(url);
          const qrSize = 232, pad = 20;
          const qrX = (CARD_W - qrSize) / 2;
          const qrY = CARD_H - qrSize - 76;
          ctx.fillStyle = "#ffffff";
          roundRectPath(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 20);
          ctx.fill();
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          ctx.font = "600 14px 'Helvetica Neue', Arial, sans-serif";
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.75;
          ctx.fillText("SCAN TO VIEW MY LINKS", CARD_W / 2, qrY - pad - 16);
          ctx.globalAlpha = 1;
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      ctx.restore();

      // Cache the rendered PNG as soon as the card is ready. Download/Share read
      // from this cache instead of calling canvas.toBlob() themselves — Safari
      // requires navigator.share() to run synchronously inside the click handler,
      // and any `await` beforehand (like a fresh toBlob() call) silently drops it.
      try {
        canvas.toBlob(b => setCardBlob(b), "image/png");
      } catch {
        setCardBlob(null);
      }
    } finally {
      setRendering(false);
    }
  };

  const handleDownload = () => {
    if (!cardBlob) { setAlert("Card image isn't ready yet — try again in a moment."); return; }
    const url = URL.createObjectURL(cardBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user?.username || "business"}-card.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!cardBlob) { setAlert("Card image isn't ready yet — try again in a moment."); return; }
    const file = new File([cardBlob], `${user?.username || "business"}-card.png`, { type: "image/png" });
    const nav = navigator as any;
    if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      nav.share({
        files: [file],
        title: "My Influanto Business Card",
        text: `Check out my links: influanto.com/${user?.username}`,
      }).catch((err: any) => {
        if (err?.name === "AbortError") return; // user closed the share sheet
        handleDownload();
        setAlert("Sharing isn't supported here — image downloaded instead.");
      });
    } else {
      handleDownload();
      setAlert("Sharing isn't supported on this browser — image downloaded instead.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("businessCard", JSON.stringify({ displayName, bgColor, avatar }));
      await apiClient.post("/user", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUser((prev: any) => ({ ...prev, businessCard: { displayName, bgColor, avatar } }));
      setAlert("Business card saved", true);
    } catch {
      setAlert("Could not save business card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">Display name</label>
          <input
            className="input input-sm input-bordered w-full"
            placeholder={user?.username}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="block text-xs font-medium">Background color</label>
          <input
            type="color"
            value={bgColor}
            onChange={e => setBgColor(e.target.value)}
            className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Avatar (optional)</label>
          <div className="flex items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200" />
            )}
            <button type="button" className="btn btn-xs btn-outline" onClick={() => setShowImagePicker(true)}>
              {avatar ? "Change" : "+ Add photo"}
            </button>
            {avatar && (
              <button type="button" className="btn btn-xs btn-outline text-red-500 border-red-300" onClick={() => setAvatar("")}>
                Remove
              </button>
            )}
          </div>
        </div>

        {alert && <p className={`text-xs ${alertOk ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn btn-sm btn-outline" disabled={rendering} onClick={handleDownload}>
            <FontAwesomeIcon icon={faDownload} className="mr-1.5" /> Download image
          </button>
          <button type="button" className="btn btn-sm btn-outline" disabled={rendering} onClick={handleShare}>
            <FontAwesomeIcon icon={faShareNodes} className="mr-1.5" /> Share
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-start justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", maxWidth: 280, height: "auto", borderRadius: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        />
      </div>

      {showImagePicker && (
        <ImagePicker
          images={galleryImages}
          uploadPreset="ReleasePageImages"
          uploadOptions={{ publicId: `user_${user?.id}_businesscard_${Date.now()}` }}
          title="Choose an avatar"
          onUploaded={(result: any) => {
            const url = result.info?.secure_url || "";
            setAvatar(url);
            setGalleryImages(prev => [url, ...prev.filter(i => i !== url)]);
            setShowImagePicker(false);
          }}
          onSelect={(url: string) => { setAvatar(url); setShowImagePicker(false); }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
