"use client";
import React, { useRef } from "react";

// Draw-your-signature pad (split sheets and documents). onSave gets a PNG data URL.
export default function SignatureCanvas({ onSave, saving }: { onSave: (data: string) => void; saving?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX-r.left)/r.width)*canvasRef.current!.width, y: ((e.clientY-r.top)/r.height)*canvasRef.current!.height };
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  const save = () => onSave(canvasRef.current!.toDataURL("image/png"));

  return (
    <div>
      <canvas
        ref={canvasRef} width={600} height={180}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair"
        style={{ height: 180 }}
        onPointerDown={e => { const p=pos(e); const ctx=canvasRef.current!.getContext("2d")!; ctx.strokeStyle="#111"; ctx.lineWidth=3; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.beginPath(); ctx.moveTo(p.x,p.y); lastPos.current=p; drawing.current=true; canvasRef.current!.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if(!drawing.current||!lastPos.current) return; const p=pos(e); const ctx=canvasRef.current!.getContext("2d")!; ctx.lineTo(p.x,p.y); ctx.stroke(); lastPos.current=p; }}
        onPointerUp={e => { drawing.current=false; lastPos.current=null; canvasRef.current!.releasePointerCapture(e.pointerId); }}
        onPointerLeave={() => { drawing.current=false; }}
      />
      <div className="mt-3 flex items-center gap-4">
        <button type="button" onClick={clear} disabled={saving} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
        <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">{saving ? "Saving…" : "Save Signature"}</button>
      </div>
    </div>
  );
}
