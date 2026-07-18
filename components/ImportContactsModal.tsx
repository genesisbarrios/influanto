"use client";
/* eslint-disable */
import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

export interface ImportField {
  key: string;
  label: string;
  aliases: string[]; // header names that map to this field (lowercased compare)
}

interface Props {
  title?: string;
  fields: ImportField[]; // must include one with key "email"
  onImport: (rows: Record<string, string>[]) => Promise<{ added: number; skipped: number } | void>;
  onClose: () => void;
}

// ── Minimal CSV/TSV tokenizer (handles quoted fields, commas, tabs) ────────────
function parseDelimited(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === "," || ch === "\t") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* ignore */ }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

function looksLikeEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((s || "").trim());
}

export function parseContacts(text: string, fields: ImportField[]): Record<string, string>[] {
  const rows = parseDelimited(text);
  if (!rows.length) return [];

  const aliasMap: Record<string, string> = {};
  fields.forEach(f => [f.key, f.label, ...f.aliases].forEach(a => { aliasMap[a.toLowerCase().trim()] = f.key; }));

  const header = rows[0].map(c => c.trim().toLowerCase());
  const headerIsHeader = header.some(h => aliasMap[h]) && !header.some(h => h.includes("@"));

  const otherKeys = fields.map(f => f.key).filter(k => k !== "email");
  const ncols = Math.max(...rows.map(r => r.length));
  let colMap: (string | null)[] = [];
  let dataRows: string[][];

  if (headerIsHeader) {
    colMap = header.map(h => aliasMap[h] || null);
    dataRows = rows.slice(1);
  } else {
    // No header — infer the email column by content, map the rest positionally.
    let emailCol = -1;
    for (let c = 0; c < ncols; c++) {
      const hits = rows.filter(r => looksLikeEmail(r[c] || "")).length;
      if (hits > rows.length / 2) { emailCol = c; break; }
    }
    if (emailCol === -1 && ncols === 1) emailCol = 0; // one-email-per-line
    let oi = 0;
    for (let c = 0; c < ncols; c++) colMap[c] = c === emailCol ? "email" : (otherKeys[oi++] || null);
    dataRows = rows;
  }

  return dataRows
    .map(r => {
      const rec: Record<string, string> = {};
      r.forEach((cell, c) => { const key = colMap[c]; if (key) rec[key] = (cell || "").trim(); });
      return rec;
    })
    .filter(rec => looksLikeEmail(rec.email || ""));
}

export default function ImportContactsModal({ title = "Import Contacts", fields, onImport, onClose }: Props) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseContacts(text, fields), [text, fields]);
  const optionalLabels = fields.filter(f => f.key !== "email").map(f => f.label).join(", ");

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const isExcel = /\.xlsx?$/i.test(file.name);
    const reader = new FileReader();
    if (isExcel) {
      reader.onload = () => {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        setText(XLSX.utils.sheet_to_csv(firstSheet));
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => setText(String(reader.result || ""));
      reader.readAsText(file);
    }
  };

  const doImport = async () => {
    if (!parsed.length) { setError("No valid contacts found — every contact needs an email."); return; }
    setBusy(true); setError("");
    try {
      const res = await onImport(parsed);
      if (res) setResult(`Imported ${res.added} contact${res.added !== 1 ? "s" : ""}${res.skipped ? `, skipped ${res.skipped} duplicate${res.skipped !== 1 ? "s" : ""}` : ""}.`);
      else setResult(`Imported ${parsed.length} contacts.`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">Paste a list or load a CSV/Excel file.</p>
        </div>

        {result ? (
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium">{result}</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <button className="btn btn-sm btn-outline" onClick={() => fileRef.current?.click()}>Choose CSV or Excel file</button>
                {fileName && <span className="text-xs text-gray-500 truncate">{fileName}</span>}
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden"
                  onChange={e => handleFile(e.target.files?.[0])} />
              </div>

              <textarea
                className="textarea textarea-bordered w-full font-mono text-xs"
                rows={7}
                placeholder={`Paste contacts here. Examples:\n\nemail,${fields.filter(f=>f.key!=='email').map(f=>f.key).join(',')}\njane@example.com,Jane Doe\n\n…or one email per line.`}
                value={text}
                onChange={e => { setText(e.target.value); setFileName(""); }}
              />

              <p className="text-xs text-gray-400">
                A header row is optional. Recognized columns: <strong>email</strong> (required){optionalLabels ? `, ${optionalLabels}` : ""}.
              </p>

              {text.trim() && (
                <p className="text-xs font-medium text-indigo-600">{parsed.length} valid contact{parsed.length !== 1 ? "s" : ""} detected</p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="px-5 pb-5 flex justify-end gap-2">
              <button className="btn btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={busy || !parsed.length} onClick={doImport}>
                {busy ? "Importing…" : `Import ${parsed.length || ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
