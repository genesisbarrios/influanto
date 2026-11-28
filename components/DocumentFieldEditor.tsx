"use client";
import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature, faFont, faTrash } from "@fortawesome/free-solid-svg-icons";
import PdfFieldPages from "@/components/PdfFieldPages";
import { DEFAULT_SIZE, DocField, FieldType, MAX_FIELD_TEXT } from "@/libs/documentFields";

export const SIGNER_COLORS = ["#4f46e5", "#db2777", "#059669", "#d97706", "#0891b2", "#7c3aed", "#dc2626", "#65a30d", "#2563eb", "#c026d3"];
const ME_COLOR = "#6b7280";

type Person = { name: string; email: string };

/**
 * Place signature and text fields on the pages and assign each to a signer
 * (text fields can also be "me": the sender types it now).
 */
export default function DocumentFieldEditor({
  blob,
  signers,
  fields,
  onChange,
}: {
  blob: Blob;
  signers: Person[];
  fields: DocField[];
  onChange: (f: DocField[]) => void;
}) {
  const [tool, setTool] = useState<FieldType | null>(null);
  const [assignee, setAssignee] = useState(signers[0]?.email.toLowerCase() || "");
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ id: string; mode: "move" | "resize"; sx: number; sy: number; start: DocField; pw: number; ph: number } | null>(null);
  const latest = useRef(fields);
  latest.current = fields;

  const colorOf = (a: string) => {
    if (a === "me") return ME_COLOR;
    const i = signers.findIndex((s) => s.email.toLowerCase() === a);
    return SIGNER_COLORS[(i < 0 ? 0 : i) % SIGNER_COLORS.length];
  };
  const nameOf = (a: string) => (a === "me" ? "You" : signers.find((s) => s.email.toLowerCase() === a)?.name || a);
  const update = (id: string, patch: Partial<DocField>) => onChange(latest.current.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => { onChange(latest.current.filter((f) => f.id !== id)); setSelected(null); };

  const add = (page: number, x: number, y: number) => {
    if (!tool) { setSelected(null); return; }
    const size = DEFAULT_SIZE[tool];
    const who = tool === "signature" && assignee === "me" ? signers[0]?.email.toLowerCase() || "" : assignee;
    if (!who) return;
    const f: DocField = {
      id: Math.random().toString(36).slice(2, 10),
      type: tool,
      page,
      w: size.w,
      h: size.h,
      x: Math.min(Math.max(0, x - size.w / 2), 1 - size.w),
      y: Math.min(Math.max(0, y - size.h / 2), 1 - size.h),
      assignee: who,
      ...(who === "me" ? { value: "" } : {}),
    };
    onChange([...latest.current, f]);
    setSelected(f.id);
    setTool(null);
  };

  const startDrag = (e: React.PointerEvent, f: DocField, mode: "move" | "resize") => {
    e.stopPropagation();
    const page = (e.currentTarget as HTMLElement).closest("[data-page]") as HTMLElement | null;
    if (!page) return;
    const r = page.getBoundingClientRect();
    drag.current = { id: f.id, mode, sx: e.clientX, sy: e.clientY, start: f, pw: r.width, ph: r.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelected(f.id);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / d.pw, dy = (e.clientY - d.sy) / d.ph;
    const s = d.start;
    if (d.mode === "move") {
      update(d.id, { x: Math.min(Math.max(0, s.x + dx), 1 - s.w), y: Math.min(Math.max(0, s.y + dy), 1 - s.h) });
    } else {
      update(d.id, { w: Math.min(Math.max(0.04, s.w + dx), 1 - s.x), h: Math.min(Math.max(0.02, s.h + dy), 1 - s.y) });
    }
  };
  const endDrag = () => { drag.current = null; };

  const sel = fields.find((f) => f.id === selected) || null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
        <label className="text-xs font-medium flex items-center gap-1.5">
          For
          <select className="select select-bordered select-xs bg-white" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {signers.map((s) => (
              <option key={s.email} value={s.email.toLowerCase()}>{s.name || s.email}</option>
            ))}
            <option value="me">Me (fill in now)</option>
          </select>
        </label>
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: colorOf(assignee) }} />
        <button
          className={`btn btn-xs ${tool === "signature" ? "btn-primary" : "btn-outline"}`}
          title={assignee === "me" ? "Signature fields are for signers: it goes to the first signer, change it after placing" : ""}
          onClick={() => setTool(tool === "signature" ? null : "signature")}
        >
          <FontAwesomeIcon icon={faSignature} /> Signature
        </button>
        <button className={`btn btn-xs ${tool === "text" ? "btn-primary" : "btn-outline"}`} onClick={() => setTool(tool === "text" ? null : "text")}>
          <FontAwesomeIcon icon={faFont} /> Text
        </button>
        <span className="text-xs text-gray-500">
          {tool ? "Click on the page where it goes." : `${fields.length} field${fields.length === 1 ? "" : "s"}. Drag to move, pull the corner to resize.`}
        </span>
      </div>

      {/* the selected field */}
      {sel && (
        <div className="flex flex-wrap items-center gap-2 py-2 border-b text-xs">
          <span className="font-medium">{sel.type === "signature" ? "Signature" : "Text"} field</span>
          <select
            className="select select-bordered select-xs bg-white"
            value={sel.assignee}
            onChange={(e) => update(sel.id, { assignee: e.target.value, value: e.target.value === "me" ? sel.value || "" : undefined })}
          >
            {signers.map((s) => (
              <option key={s.email} value={s.email.toLowerCase()}>{s.name || s.email}</option>
            ))}
            {sel.type === "text" && <option value="me">Me (fill in now)</option>}
          </select>
          {sel.type === "text" && sel.assignee === "me" && (
            <input
              className="input input-bordered input-xs bg-white flex-1 min-w-[10rem]"
              placeholder="Type the text"
              maxLength={MAX_FIELD_TEXT}
              value={sel.value || ""}
              onChange={(e) => update(sel.id, { value: e.target.value })}
              autoFocus
            />
          )}
          {sel.type === "text" && sel.assignee !== "me" && (
            <input
              className="input input-bordered input-xs bg-white flex-1 min-w-[10rem]"
              placeholder="Label, e.g. Address (optional)"
              maxLength={60}
              value={sel.label || ""}
              onChange={(e) => update(sel.id, { label: e.target.value })}
            />
          )}
          <button className="btn btn-xs btn-ghost text-red-500" onClick={() => remove(sel.id)}><FontAwesomeIcon icon={faTrash} /> Remove</button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-3 mt-2 rounded-lg" onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <PdfFieldPages
          blob={blob}
          className={tool ? "cursor-crosshair" : ""}
          onPageClick={add}
          overlay={(page) => (
            <div data-page={page} className="absolute inset-0 pointer-events-none">
              {fields.filter((f) => f.page === page).map((f) => {
                const c = colorOf(f.assignee);
                const on = f.id === selected;
                return (
                  <div
                    key={f.id}
                    className="absolute pointer-events-auto cursor-move rounded-sm flex items-center px-1 overflow-hidden touch-none"
                    style={{
                      left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%`,
                      background: `${c}22`, border: `${on ? 2 : 1}px ${on ? "solid" : "dashed"} ${c}`, color: c,
                    }}
                    onPointerDown={(e) => startDrag(e, f, "move")}
                    onClick={(e) => { e.stopPropagation(); setSelected(f.id); }}
                  >
                    <span className="text-[10px] sm:text-xs font-semibold truncate leading-tight">
                      {f.type === "signature"
                        ? `✍ ${nameOf(f.assignee)}`
                        : f.assignee === "me"
                          ? f.value || "Your text"
                          : `${f.label || "Text"} · ${nameOf(f.assignee)}`}
                    </span>
                    <span
                      className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize"
                      style={{ background: c }}
                      onPointerDown={(e) => startDrag(e, f, "resize")}
                    />
                  </div>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
}
