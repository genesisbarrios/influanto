"use client";
import React from "react";
import { PRO_OPTIONS, PublishingRow, ipiWarning } from "@/libs/publishing";

interface Props {
  row: PublishingRow;
  onChange: (patch: Partial<PublishingRow>) => void;
  // Styling hooks so each page keeps its own look
  inputClassName?: string;
  selectClassName?: string;
  inputStyle?: React.CSSProperties;
  nameReadOnly?: boolean; // e.g. the signing page, where the writer is the signer
  idPrefix?: string;
}

const OTHER = "__other__";

// One person's publishing details: writer + IPI + PRO, publisher + IPI, and share.
export default function PublishingRowFields({ row, onChange, inputClassName = "input input-sm w-full", selectClassName = "select select-sm select-bordered w-full", inputStyle, nameReadOnly, idPrefix = "pub" }: Props) {
  const isKnownPro = !row.pro || PRO_OPTIONS.includes(row.pro);
  const [customPro, setCustomPro] = React.useState(!isKnownPro);
  const writerIpiWarn = ipiWarning(row.writerIpi);
  const publisherIpiWarn = ipiWarning(row.publisherIpi);

  const label = (htmlFor: string, text: string) => (
    <label htmlFor={htmlFor} className="block text-[11px] font-medium text-gray-500 mb-0.5">{text}</label>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
      <div className="sm:col-span-2">
        {label(`${idPrefix}-writer`, "Writer name")}
        <input id={`${idPrefix}-writer`} className={inputClassName} style={inputStyle} placeholder="Legal / writer name"
          value={row.contributorName} readOnly={nameReadOnly}
          onChange={(e) => onChange({ contributorName: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        {label(`${idPrefix}-writer-ipi`, "Writer IPI #")}
        <input id={`${idPrefix}-writer-ipi`} className={inputClassName} style={inputStyle} placeholder="e.g. 00123456789" inputMode="numeric"
          value={row.writerIpi} onChange={(e) => onChange({ writerIpi: e.target.value })} />
        {writerIpiWarn && <p className="text-[11px] text-amber-600 mt-0.5">{writerIpiWarn}</p>}
      </div>
      <div className="sm:col-span-2">
        {label(`${idPrefix}-pro`, "PRO")}
        <select id={`${idPrefix}-pro`} className={selectClassName} style={inputStyle}
          value={customPro ? OTHER : row.pro}
          onChange={(e) => {
            if (e.target.value === OTHER) { setCustomPro(true); onChange({ pro: "" }); }
            else { setCustomPro(false); onChange({ pro: e.target.value }); }
          }}>
          <option value="">Select PRO…</option>
          {PRO_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          <option value={OTHER}>Other…</option>
        </select>
        {customPro && (
          <input className={`${inputClassName} mt-1`} style={inputStyle} placeholder="PRO name" autoFocus
            value={row.pro} onChange={(e) => onChange({ pro: e.target.value })} />
        )}
      </div>
      <div className="sm:col-span-3">
        {label(`${idPrefix}-publisher`, "Publisher name")}
        <input id={`${idPrefix}-publisher`} className={inputClassName} style={inputStyle} placeholder="Publishing company (or self-published)"
          value={row.publisher} onChange={(e) => onChange({ publisher: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        {label(`${idPrefix}-publisher-ipi`, "Publisher IPI #")}
        <input id={`${idPrefix}-publisher-ipi`} className={inputClassName} style={inputStyle} placeholder="e.g. 00987654321" inputMode="numeric"
          value={row.publisherIpi} onChange={(e) => onChange({ publisherIpi: e.target.value })} />
        {publisherIpiWarn && <p className="text-[11px] text-amber-600 mt-0.5">{publisherIpiWarn}</p>}
      </div>
      <div className="sm:col-span-1">
        {label(`${idPrefix}-percent`, "Pub %")}
        <input id={`${idPrefix}-percent`} className={inputClassName} style={inputStyle} placeholder="%" inputMode="decimal"
          value={row.percent} onChange={(e) => onChange({ percent: e.target.value })} />
      </div>
    </div>
  );
}
