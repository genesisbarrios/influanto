"use client";
/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contributor { name: string; role: string; ownership: string; contact: string; signature: string; signatureDate: string }
interface Publishing   { contributorName: string; publisher: string; percent: string }
interface SheetData {
  id: string; title: string; date: string; artists: string; stateCountry: string;
  contributors: Contributor[]; publishing: Publishing[];
}
interface SignerData { id: string; name: string; email: string; signedAt: string | null; signatureData: string | null }

// ─── PDF generation ───────────────────────────────────────────────────────────

function downloadPDF(sheet: SheetData, overrideSignature?: { name: string; data: string }) {
  const doc = new jsPDF();
  const contributors = sheet.contributors ?? [];
  const publishing = sheet.publishing ?? [];
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  doc.setFontSize(10); doc.setTextColor(100);
  const brand = "influanto";
  doc.text(brand, doc.internal.pageSize.getWidth() - doc.getTextWidth(brand) - 10, 10);
  doc.setFontSize(16); doc.setTextColor(0);
  doc.text("SPLIT SHEET AGREEMENT", 10, 15);
  doc.setFontSize(12);
  doc.text(`Song Title: ${sheet.title}`, 10, 30);
  doc.text(`Date: ${sheet.date}`, 10, 40);
  doc.text(`Artist(s): ${sheet.artists}`, 10, 50);
  doc.text("Primary Contributors:", 10, 60);
  y = 65;

  const headers = () => {
    doc.setFillColor(243, 244, 246);
    [[10,40],[50,50],[100,15],[115,75]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
    doc.text("Name",12,y+6); doc.text("Role",52,y+6); doc.text("Own%",102,y+6); doc.text("Contact",117,y+6);
    y += 8;
  };
  headers();

  contributors.forEach(c => {
    const h = Math.max(Math.ceil((c.name||"").length/18), Math.ceil((c.role||"").length/25), Math.ceil((c.contact||"").length/32), 1) * 8;
    if (y + h > ph - 20) { doc.addPage(); y = 20; headers(); }
    [[10,40],[50,50],[100,15],[115,75]].forEach(([x,w]) => doc.rect(x, y, w, h));
    doc.text(c.name||"",12,y+6,{maxWidth:38}); doc.text(c.role||"",52,y+6,{maxWidth:48});
    doc.text(c.ownership ? `${c.ownership}%`:"",102,y+6); doc.text(c.contact||"",117,y+6,{maxWidth:73});
    y += h;
  });

  if (publishing.length) {
    y += 6; if (y+20 > ph-20) { doc.addPage(); y=20; }
    doc.text("Publishing Details:", 10, y); y += 5;
    doc.setFillColor(243,244,246);
    [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
    doc.text("Contributor",12,y+6); doc.text("Publisher",72,y+6); doc.text("%",132,y+6); y += 8;
    publishing.forEach(p => {
      const h = Math.max(Math.ceil((p.contributorName||"").length/30), Math.ceil((p.publisher||"").length/30), 1) * 8;
      if (y+h > ph-20) { doc.addPage(); y=20; }
      [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, h));
      doc.text(p.contributorName||"",12,y+6,{maxWidth:58}); doc.text(p.publisher||"",72,y+6,{maxWidth:58});
      doc.text(p.percent ? `${p.percent}%`:"",132,y+6); y += h;
    });
  }

  // Signatures
  y += 8; if (y+20 > ph-20) { doc.addPage(); y=20; }
  doc.text("Signatures:", 10, y); y += 5;
  [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
  doc.text("Name",12,y+6); doc.text("Signature",72,y+6); doc.text("Date",132,y+6); y += 8;

  contributors.forEach(c => {
    const h = 20; if (y+h > ph-20) { doc.addPage(); y=20; }
    [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, h));
    doc.text(c.name||"",12,y+6,{maxWidth:58});
    // Use override signature if this contributor's name matches
    const sigData = overrideSignature && (c.name||"").toLowerCase() === overrideSignature.name.toLowerCase()
      ? overrideSignature.data
      : c.signature;
    if (sigData) { try { doc.addImage(sigData,"PNG",72,y+2,56,h-4); } catch {} }
    const sigDate = overrideSignature && (c.name||"").toLowerCase() === overrideSignature.name.toLowerCase()
      ? new Date().toLocaleDateString("en-US")
      : c.signatureDate;
    doc.text(sigDate||"",132,y+6,{maxWidth:58}); y += h;
  });

  // Agreement terms (matches the on-screen terms)
  y += 10; if (y+30 > ph-20) { doc.addPage(); y=20; }
  doc.setFontSize(12); doc.setTextColor(0);
  doc.text("Agreement Terms:", 10, y); y += 6;
  doc.setFontSize(10); doc.setTextColor(60);
  const termsText =
    `Each contributor agrees to the ownership percentages of the composition and master recording specified above. ` +
    `All royalties will be distributed accordingly. Dispute resolution under the laws of ${sheet.stateCountry || "[State/Country]"}. ` +
    `By signing, all parties acknowledge their contributions are accurately reflected.`;
  doc.splitTextToSize(termsText, 190).forEach((line: string) => {
    if (y+6 > ph-20) { doc.addPage(); y=20; }
    doc.text(line, 10, y); y += 6;
  });
  doc.setTextColor(0);

  doc.save(`${sheet.title||"split-sheet"}_signed_influanto.pdf`);
}

// ─── Signature canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onSave, saving }: { onSave: (data: string) => void; saving?: boolean }) {
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [signer, setSigner] = useState<SignerData | null>(null);
  const [step, setStep] = useState<"sign" | "done">("sign");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/sign/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setSheet(d.sheet);
        setSigner(d.signer);
        if (d.signer.signedAt) setStep("done");
      })
      .catch(() => setError("Failed to load split sheet"))
      .finally(() => setLoading(false));
  }, [token]);

  const submitSignature = async (signatureData: string) => {
    if (!signatureData) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to save signature"); return; }
      setSigner(prev => prev ? { ...prev, signedAt: data.signedAt, signatureData } : prev);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading split sheet…</div>
      </div>
    );
  }

  // ── Error ──
  if (error || !sheet || !signer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid or Expired Link</h1>
          <p className="text-gray-500 text-sm">{error || "This signing link is no longer valid."}</p>
          <a href="https://influanto.com" className="mt-6 inline-block btn btn-primary btn-sm">Go to Influanto</a>
        </div>
      </div>
    );
  }

  const loginUrl = `/api/auth/signin?callbackUrl=${encodeURIComponent("/dashboard")}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <a href="https://influanto.com" className="inline-block mb-4">
            <span className="text-2xl font-bold text-indigo-600">influanto</span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Split Sheet Agreement</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hi <strong>{signer.name}</strong> — please review and sign below
          </p>
        </div>

        {/* Sheet details card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
            <div><span className="text-gray-400 block text-xs uppercase tracking-wide">Song Title</span><span className="font-semibold text-gray-900">{sheet.title}</span></div>
            {sheet.date && <div><span className="text-gray-400 block text-xs uppercase tracking-wide">Date</span><span className="font-semibold text-gray-900">{sheet.date}</span></div>}
            {sheet.artists && <div className="col-span-2"><span className="text-gray-400 block text-xs uppercase tracking-wide">Artist(s)</span><span className="font-semibold text-gray-900">{sheet.artists}</span></div>}
          </div>

          {/* Contributors table */}
          <h2 className="font-semibold text-gray-800 mb-2 text-sm">Contributors</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-100 mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Name</th>
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Role</th>
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Ownership</th>
                </tr>
              </thead>
              <tbody>
                {sheet.contributors.map((c, i) => (
                  <tr key={i} className={`border-t border-gray-50 ${(c.name||"").toLowerCase() === (signer.name||"").toLowerCase() ? "bg-indigo-50" : ""}`}>
                    <td className="p-3 font-medium">
                      {c.name}
                      {(c.name||"").toLowerCase() === (signer.name||"").toLowerCase() && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500">{c.role}</td>
                    <td className="p-3 font-semibold">{c.ownership ? `${c.ownership}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publishing */}
          {sheet.publishing.length > 0 && (
            <>
              <h2 className="font-semibold text-gray-800 mb-2 text-sm">Publishing</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-100 mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-xs text-gray-500 font-medium">Contributor</th>
                      <th className="text-left p-3 text-xs text-gray-500 font-medium">Publisher</th>
                      <th className="text-left p-3 text-xs text-gray-500 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.publishing.map((p, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="p-3">{p.contributorName}</td>
                        <td className="p-3 text-gray-500">{p.publisher}</td>
                        <td className="p-3">{p.percent ? `${p.percent}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Agreement terms */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Agreement Terms:</strong> Each contributor agrees to the ownership percentages of the composition and master recording. All royalties will be distributed accordingly.
            {sheet.stateCountry && <> Dispute resolution under the laws of <em>{sheet.stateCountry}</em>.</>}
            {" "}By signing, all parties acknowledge their contributions are accurately reflected.
          </div>
        </div>

        {/* ── Signature ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4">Your Signature</h2>

          {step === "done" ? (
            <>
              {signer.signatureData && (
                <div className="flex justify-center border border-gray-200 rounded-xl bg-white p-2 mb-2">
                  <img src={signer.signatureData} alt="Your signature" className="max-h-20 object-contain" />
                </div>
              )}
              <p className="text-xs text-green-700 mb-4">
                ✅ Signed{signer.signedAt ? ` on ${new Date(signer.signedAt).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}` : ""}
              </p>
              <button
                onClick={() => downloadPDF(sheet, signer.signatureData ? { name: signer.name, data: signer.signatureData } : undefined)}
                className="btn btn-primary w-full"
              >
                ⬇️ Download PDF
              </button>
            </>
          ) : (
            <SignatureCanvas saving={submitting} onSave={submitSignature} />
          )}
        </div>

        {/* Login CTA (always visible except done) */}
        {step !== "done" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium text-gray-800 text-sm">Have an Influanto account?</p>
              <p className="text-xs text-gray-400">Log in to manage and track your own split sheets</p>
            </div>
            <a href={loginUrl} className="btn btn-sm btn-outline">
              🔐 Login / Sign up
            </a>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-6">
          Powered by <a href="https://influanto.com" className="text-indigo-500">Influanto</a>
        </p>
      </div>
    </div>
  );
}
