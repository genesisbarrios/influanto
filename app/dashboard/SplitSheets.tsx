"use client";
/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import apiClient from "@/libs/api";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";
import posthog from "posthog-js";
import ImportContactsModal, { ImportField } from "@/components/ImportContactsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp, faXmark, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const FREE_SPLIT_SHEET_LIMIT = 5;

const IMPORT_FIELDS: ImportField[] = [
  { key: "email", label: "Email", aliases: ["e-mail", "mail"] },
  { key: "name", label: "Name", aliases: ["full name", "fullname"] },
  { key: "role", label: "Role", aliases: ["title", "credit"] },
  { key: "phone", label: "Phone", aliases: ["phone number", "tel", "mobile"] },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contributor {
  name: string; role: string; ownership: string; contact: string;
  signature: string; signatureDate: string;
}
interface Publishing { contributorName: string; publisher: string; percent: string }
interface SplitSheet {
  id: string; title: string; date: string; artists: string; stateCountry: string;
  contributors: Contributor[]; publishing: Publishing[];
  status: "draft" | "sent" | "completed"; created_at: string;
}
interface Contact { id: string; name: string; email: string; role: string; phone: string }

const BLANK_CONTRIBUTOR: Contributor = { name: "", role: "", ownership: "", contact: "", signature: "", signatureDate: "" };
const BLANK_PUBLISHING: Publishing = { contributorName: "", publisher: "", percent: "" };
const BLANK_SHEET = (): Partial<SplitSheet> => ({
  title: "", date: new Date().toLocaleDateString("en-US"), artists: "",
  stateCountry: "", contributors: [{ ...BLANK_CONTRIBUTOR }], publishing: [], status: "draft",
});

// ─── Ownership pie chart ────────────────────────────────────────────────────────

const PIE_PALETTE = [
  "#2563eb", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6", "#84cc16",
];

function getOwnershipData(contributors: Contributor[]): { name: string; value: number }[] {
  return (contributors ?? [])
    .filter(c => c.name)
    .map(c => ({ name: c.name, value: parseFloat(String(c.ownership).replace("%", "")) || 0 }))
    .filter(c => c.value > 0);
}

function OwnershipPie({ contributors, size = "large" }: { contributors: Contributor[]; size?: "large" | "small" }) {
  const data = getOwnershipData(contributors);

  if (data.length === 0) {
    return size === "small" ? null : (
      <p className="text-xs text-gray-400 text-center py-8">Add ownership % to see the split</p>
    );
  }

  if (size === "small") {
    return (
      <ResponsiveContainer width={56} height={56}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={26}>
            {data.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: any) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={32}
          label={({ name, value }: any) => `${name} ${value}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: any) => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── PDF export (mirrors the public split sheet generator) ────────────────────

function downloadSheetPDF(sheet: Partial<SplitSheet>) {
  const doc = new jsPDF();
  const contributors: Contributor[] = (sheet.contributors as any) ?? [];
  const publishing: Publishing[] = (sheet.publishing as any) ?? [];
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 0;

  doc.setFontSize(10); doc.setTextColor(100);
  const brand = "influanto";
  doc.text(brand, doc.internal.pageSize.getWidth() - doc.getTextWidth(brand) - 10, 10);

  doc.setFontSize(16); doc.setTextColor(0);
  doc.text("SPLIT SHEET AGREEMENT", 10, 15);
  doc.setFontSize(12);
  doc.text(`Song Title: ${sheet.title ?? ""}`, 10, 30);
  doc.text(`Date: ${sheet.date ?? ""}`, 10, 40);
  doc.text(`Artist(s): ${sheet.artists ?? ""}`, 10, 50);
  doc.text("Primary Contributors:", 10, 60);
  y = 65;

  const addHeaders = () => {
    doc.setFillColor(243, 244, 246);
    [[10,40],[50,50],[100,15],[115,75]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
    doc.setTextColor(0);
    doc.text("Name",12,y+6); doc.text("Role",52,y+6); doc.text("Own%",102,y+6); doc.text("Contact",117,y+6);
    y += 8;
  };
  addHeaders();

  contributors.forEach((c) => {
    const h = Math.max(Math.ceil((c.name||"").length/18), Math.ceil((c.role||"").length/25), Math.ceil((c.contact||"").length/32), 1) * 8;
    if (y + h > pageHeight - 20) { doc.addPage(); y = 20; addHeaders(); }
    [[10,40],[50,50],[100,15],[115,75]].forEach(([x,w]) => doc.rect(x, y, w, h));
    doc.text(c.name||"",12,y+6,{maxWidth:38});
    doc.text(c.role||"",52,y+6,{maxWidth:48});
    doc.text(c.ownership ? `${c.ownership}%` : "",102,y+6);
    doc.text(c.contact||"",117,y+6,{maxWidth:73});
    y += h;
  });

  if (publishing.length) {
    y += 6;
    if (y + 20 > pageHeight - 20) { doc.addPage(); y = 20; }
    doc.text("Publishing Details:", 10, y); y += 5;
    doc.setFillColor(243,244,246);
    [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
    doc.text("Contributor",12,y+6); doc.text("Publisher",72,y+6); doc.text("%",132,y+6);
    y += 8;
    publishing.forEach((p) => {
      const h = Math.max(Math.ceil((p.contributorName||"").length/30), Math.ceil((p.publisher||"").length/30), 1) * 8;
      if (y + h > pageHeight - 20) { doc.addPage(); y = 20; }
      [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, h));
      doc.text(p.contributorName||"",12,y+6,{maxWidth:58});
      doc.text(p.publisher||"",72,y+6,{maxWidth:58});
      doc.text(p.percent ? `${p.percent}%` : "",132,y+6);
      y += h;
    });
  }

  // Signatures section
  y += 8;
  if (y + 20 > pageHeight - 20) { doc.addPage(); y = 20; }
  doc.text("Signatures:", 10, y); y += 5;
  [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
  doc.text("Name",12,y+6); doc.text("Signature",72,y+6); doc.text("Date",132,y+6);
  y += 8;
  contributors.forEach((c) => {
    const h = 20;
    if (y + h > pageHeight - 20) { doc.addPage(); y = 20; }
    [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, h));
    doc.text(c.name||"",12,y+6,{maxWidth:58});
    if (c.signature) { try { doc.addImage(c.signature,"PNG",72,y+2,56,h-4); } catch {} }
    doc.text(c.signatureDate||"",132,y+6,{maxWidth:58});
    y += h;
  });

  // Agreement terms (matches the on-screen preview and emailed version)
  y += 10;
  if (y + 30 > pageHeight - 20) { doc.addPage(); y = 20; }
  doc.setFontSize(12); doc.setTextColor(0);
  doc.text("Agreement Terms:", 10, y); y += 6;
  doc.setFontSize(10); doc.setTextColor(60);
  const termsText =
    `Each contributor agrees to the ownership percentages of the composition and master recording specified above. ` +
    `All royalties will be distributed accordingly. Dispute resolution under the laws of ${sheet.stateCountry || "[State/Country]"}. ` +
    `By signing, all parties acknowledge their contributions are accurately reflected.`;
  const termsLines = doc.splitTextToSize(termsText, 190);
  termsLines.forEach((line: string) => {
    if (y + 6 > pageHeight - 20) { doc.addPage(); y = 20; }
    doc.text(line, 10, y);
    y += 6;
  });
  doc.setTextColor(0);

  doc.save(`${sheet.title||"split-sheet"}_${sheet.date||""}_influanto.pdf`);
}

// ─── Signature canvas modal ───────────────────────────────────────────────────

function SignatureModal({ onSave, onClose, existing }: { onSave: (data: string) => void; onClose: () => void; existing?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (existing) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0,canvas.width,canvas.height); img.src = existing; }
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX-r.left)/r.width)*canvasRef.current!.width, y: ((e.clientY-r.top)/r.height)*canvasRef.current!.height };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Draw Signature</h3>
          <p className="text-sm text-gray-500 mt-0.5">Use your mouse or finger to sign</p>
        </div>
        <div className="p-5">
          <canvas
            ref={canvasRef} width={660} height={200}
            className="w-full border border-gray-200 rounded-lg bg-white touch-none block"
            style={{ height: 200 }}
            onPointerDown={(e) => { const p = pos(e); const ctx = canvasRef.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(p.x,p.y); lastPos.current = p; drawing.current = true; canvasRef.current!.setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (!drawing.current || !lastPos.current) return; const p = pos(e); const ctx = canvasRef.current!.getContext("2d")!; ctx.lineTo(p.x,p.y); ctx.stroke(); lastPos.current = p; }}
            onPointerUp={(e) => { drawing.current = false; lastPos.current = null; canvasRef.current!.releasePointerCapture(e.pointerId); }}
            onPointerLeave={() => { drawing.current = false; }}
          />
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button className="btn btn-sm" onClick={() => { const ctx = canvasRef.current!.getContext("2d")!; ctx.clearRect(0,0,canvasRef.current!.width,canvasRef.current!.height); }}>Clear</button>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(canvasRef.current!.toDataURL("image/png"))}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Send dialog ──────────────────────────────────────────────────────────────

function SendDialog({ sheetId, contacts, onClose, onSent }: { sheetId: string; contacts: Contact[]; onClose: () => void; onSent: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState("");

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const send = async () => {
    if (!selected.length) { setAlert("Select at least one contact"); return; }
    setSending(true);
    try {
      await apiClient.post(`/split-sheets/${sheetId}/send`, { contactIds: selected });
      posthog.capture("split_sheet_sent", { count: selected.length });
      onSent();
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Send Split Sheet</h3>
          <p className="text-sm text-gray-500 mt-0.5">Select contacts to receive this sheet via email</p>
        </div>
        <div className="p-5 max-h-72 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No contacts yet. Add contacts first.</p>
          ) : contacts.map((c) => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-gray-400">{c.email}{c.role ? ` · ${c.role}` : ""}</p>
              </div>
            </label>
          ))}
        </div>
        {alert && <p className="mx-5 text-xs text-red-500">{alert}</p>}
        <div className="px-5 pb-5 flex justify-end gap-2 mt-2">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={sending || !selected.length} onClick={send}>
            {sending ? "Sending…" : `Send to ${selected.length || ""} contact${selected.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SplitSheets() {
  useSession();
  const [user, setUser] = useState<any>(null);
  const [sheets, setSheets] = useState<SplitSheet[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [view, setView] = useState<"list" | "form" | "contacts">("list");
  const [editingSheet, setEditingSheet] = useState<Partial<SplitSheet> | null>(null);
  const [sigModal, setSigModal] = useState<number | null>(null); // contributor index
  const [sendDialog, setSendDialog] = useState<string | null>(null); // sheet id
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertRaw] = useState("");
  const [alertOk, setAlertOk] = useState(false);
  const setAlert = (msg: string, ok = false) => { setAlertRaw(msg); setAlertOk(ok); };

  // Load user + data
  useEffect(() => {
    apiClient.get("/get-user").then(r => setUser(r.data)).catch(() => {});
    loadSheets();
    loadContacts();
  }, []);

  const loadSheets = async () => {
    try { const r = await apiClient.get("/split-sheets"); setSheets(r.data ?? []); } catch {}
  };
  const loadContacts = async () => {
    try { const r = await apiClient.get("/collaborator-contacts"); setContacts(r.data ?? []); } catch {}
  };

  // ── Form helpers ────────────────────────────────────────────────────────────

  const sheet = editingSheet ?? BLANK_SHEET();
  const setSheet = (patch: Partial<SplitSheet>) => setEditingSheet(prev => ({ ...(prev ?? BLANK_SHEET()), ...patch }));

  const setContributor = (i: number, patch: Partial<Contributor>) =>
    setSheet({ contributors: (sheet.contributors as Contributor[]).map((c, idx) => idx === i ? { ...c, ...patch } : c) });

  const setPublishing = (i: number, patch: Partial<Publishing>) =>
    setSheet({ publishing: (sheet.publishing as Publishing[]).map((p, idx) => idx === i ? { ...p, ...patch } : p) });

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!sheet.title?.trim()) { setAlert("Song title is required"); return; }
    if (!(sheet as any).id && !user?.hasAccess && sheets.length >= FREE_SPLIT_SHEET_LIMIT) {
      setAlert(`You can only create up to ${FREE_SPLIT_SHEET_LIMIT} split sheets on the free plan. Upgrade for unlimited.`);
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        title: sheet.title, date: sheet.date, artists: sheet.artists,
        stateCountry: sheet.stateCountry, contributors: sheet.contributors, publishing: sheet.publishing,
      };
      if ((sheet as any).id) {
        await apiClient.put(`/split-sheets/${(sheet as any).id}`, payload);
        setAlert("Saved", true);
      } else {
        await apiClient.post("/split-sheets", payload);
        posthog.capture("split_sheet_created");
        setAlert("Created", true);
      }
      // Auto-add contributors with valid emails to collaborator contacts (skip existing)
      const existingEmails = new Set(contacts.map(c => c.email.toLowerCase()));
      const newContribs = ((sheet.contributors ?? []) as Contributor[]).filter(
        c => c.name?.trim() && c.contact?.includes("@") && !existingEmails.has(c.contact.trim().toLowerCase())
      );
      if (newContribs.length > 0) {
        await Promise.all(
          newContribs.map(c =>
            apiClient.post("/collaborator-contacts", {
              name: c.name.trim(),
              email: c.contact.trim(),
              role: c.role?.trim() ?? "",
            }).catch(() => {})
          )
        );
        await loadContacts();
      }
      await loadSheets();
      setView("list");
      setEditingSheet(null);
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteSheet = async (id: string) => {
    if (!confirm("Delete this split sheet?")) return;
    try {
      await apiClient.delete(`/split-sheets/${id}`);
      setSheets(sheets.filter(s => s.id !== id));
    } catch { setAlert("Delete failed"); }
  };

  // ── Contacts ────────────────────────────────────────────────────────────────

  const handleSaveContact = async () => {
    if (!contactForm.name?.trim() || !contactForm.email?.trim()) { setAlert("Name and email required"); return; }
    try {
      if (editingContact) {
        const r = await apiClient.put(`/collaborator-contacts/${editingContact}`, contactForm);
        setContacts(contacts.map(c => c.id === editingContact ? r.data : c));
      } else {
        const r = await apiClient.post("/collaborator-contacts", contactForm);
        setContacts([...contacts, r.data]);
      }
      setContactForm({}); setEditingContact(null); setShowAddForm(false); setAlert("");
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Save failed");
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await apiClient.delete(`/collaborator-contacts/${id}`);
      setContacts(contacts.filter(c => c.id !== id));
    } catch { setAlert("Delete failed"); }
  };

  // ── Free-tier limit ───────────────────────────────────────────────────────────

  const getMaxSheets = () => (user?.hasAccess ? Infinity : FREE_SPLIT_SHEET_LIMIT);

  // ── Contacts view ─────────────────────────────────────────────────────────

  if (view === "contacts") {
    return (
      <div className="p-4 bg-white shadow rounded-md text-black [&_input]:text-white [&_select]:text-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold">Collaborator Contacts</h2>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary" onClick={() => { setShowAddForm(v => !v); setEditingContact(null); setContactForm({}); setAlert(""); }}>Add +</button>
            <button className="btn btn-sm btn-outline" onClick={() => { setShowImport(true); setAlert(""); }}><FontAwesomeIcon icon={faFileArrowUp} className="mr-1.5" /> Import</button>
            <button className="btn btn-sm" onClick={() => { setView("list"); setContactForm({}); setEditingContact(null); setAlert(""); }}>← Back</button>
          </div>
        </div>

        {showImport && (
          <ImportContactsModal
            title="Import Collaborator Contacts"
            fields={IMPORT_FIELDS}
            onClose={() => setShowImport(false)}
            onImport={async (rows) => {
              const r = await apiClient.post("/collaborator-contacts/import", { contacts: rows });
              posthog.capture("collaborator_contacts_imported", { count: (r as any)?.added ?? rows.length });
              await loadContacts();
              return r as any;
            }}
          />
        )}

        {/* Add / edit contact form */}
        {(showAddForm || editingContact) && <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm mb-3">{editingContact ? "Edit Contact" : "Add Contact"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input className="input input-sm w-full" placeholder="Full name" value={contactForm.name ?? ""} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email *</label>
              <input className="input input-sm w-full" type="email" placeholder="email@example.com" value={contactForm.email ?? ""} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Role</label>
              <input className="input input-sm w-full" placeholder="Producer, Songwriter…" value={contactForm.role ?? ""} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone</label>
              <input className="input input-sm w-full" placeholder="Optional" value={contactForm.phone ?? ""} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          {alert && <p className="text-xs text-red-500 mt-2">{alert}</p>}
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary btn-sm" onClick={handleSaveContact}>{editingContact ? "Update" : "Add Contact"}</button>
            <button className="btn btn-sm" onClick={() => { setEditingContact(null); setContactForm({}); setShowAddForm(false); }}>Cancel</button>
          </div>
        </div>}

        {/* Contacts list */}
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No contacts yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}{c.role ? ` · ${c.role}` : ""}{c.phone ? ` · ${c.phone}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-xs btn-outline" onClick={() => { setEditingContact(c.id); setContactForm({ name: c.name, email: c.email, role: c.role, phone: c.phone }); setShowAddForm(true); }}>Edit</button>
                  <button className="btn btn-xs btn-error" onClick={() => handleDeleteContact(c.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Form view (create / edit) ─────────────────────────────────────────────

  if (view === "form") {
    const contributors = (sheet.contributors ?? []) as Contributor[];
    const publishing = (sheet.publishing ?? []) as Publishing[];

    return (
      <div className="p-4 bg-white shadow rounded-md text-black [&_input]:text-white [&_select]:text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{(sheet as any).id ? "Edit Split Sheet" : "New Split Sheet"}</h2>
          <button className="btn btn-sm" onClick={() => { setView("list"); setEditingSheet(null); setAlert(""); }}>← Back</button>
        </div>

        <div className="space-y-4 max-w-2xl">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Song Title *</label>
              <input className="input w-full" placeholder="Enter song title" value={sheet.title ?? ""} onChange={e => setSheet({ title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Creation</label>
              <input className="input w-full" placeholder="MM/DD/YYYY" value={sheet.date ?? ""} onChange={e => setSheet({ date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Artist(s)</label>
              <input className="input w-full" placeholder="Artist names" value={sheet.artists ?? ""} onChange={e => setSheet({ artists: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State / Country (Dispute Resolution)</label>
              <input className="input w-full" placeholder="e.g. California, USA" value={sheet.stateCountry ?? ""} onChange={e => setSheet({ stateCountry: e.target.value })} />
            </div>
          </div>

          {/* Contributors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Primary Contributors</h3>
              <button type="button" className="btn btn-xs btn-outline" onClick={() => setSheet({ contributors: [...contributors, { ...BLANK_CONTRIBUTOR }] })}>+ Add</button>
            </div>
            <div className="space-y-3">
              {contributors.map((c, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {contacts.length > 0 && (
                    <select
                      className="select select-xs select-bordered w-full"
                      value=""
                      onChange={e => {
                        const ct = contacts.find(x => x.id === e.target.value);
                        if (ct) setContributor(i, { name: ct.name || "", role: ct.role || "", contact: ct.email || "" });
                      }}
                    >
                      <option value="">＋ Fill from saved contact…</option>
                      {contacts.map(ct => <option key={ct.id} value={ct.id}>{ct.name || ct.email}{ct.email ? ` (${ct.email})` : ""}</option>)}
                    </select>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input input-sm" placeholder="Name" value={c.name} onChange={e => setContributor(i, { name: e.target.value })} />
                    <input className="input input-sm" placeholder="Role (Producer, Writer…)" value={c.role} onChange={e => setContributor(i, { role: e.target.value })} />
                    <input className="input input-sm" placeholder="Ownership %" value={c.ownership} onChange={e => setContributor(i, { ownership: e.target.value })} />
                    <input className="input input-sm" placeholder="Contact info / email" value={c.contact} onChange={e => setContributor(i, { contact: e.target.value })} />
                  </div>
                  {/* Signature row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-10 border border-gray-200 rounded overflow-hidden bg-white flex items-center px-2">
                      {c.signature ? <img src={c.signature} alt="sig" className="h-full object-contain" /> : <span className="text-xs text-gray-400">No signature</span>}
                    </div>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setSigModal(i)}>Sign</button>
                    {c.signatureDate && <span className="text-xs text-gray-500">{c.signatureDate}</span>}
                    <button type="button" className="btn btn-xs btn-error" onClick={() => setSheet({ contributors: contributors.filter((_,idx) => idx !== i) })}><FontAwesomeIcon icon={faXmark} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publishing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Publishing Details</h3>
              <button type="button" className="btn btn-xs btn-outline" onClick={() => setSheet({ publishing: [...publishing, { ...BLANK_PUBLISHING }] })}>+ Add</button>
            </div>
            <div className="space-y-2">
              {publishing.map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2">
                  <input className="input input-sm w-full sm:flex-1 min-w-0" placeholder="Contributor Name" value={p.contributorName} onChange={e => setPublishing(i, { contributorName: e.target.value })} />
                  <input className="input input-sm w-full sm:flex-1 min-w-0" placeholder="Publisher" value={p.publisher} onChange={e => setPublishing(i, { publisher: e.target.value })} />
                  <div className="flex gap-2">
                    <input className="input input-sm flex-1 sm:w-20 sm:flex-none min-w-0" placeholder="%" value={p.percent} onChange={e => setPublishing(i, { percent: e.target.value })} />
                    <button type="button" className="btn btn-xs btn-error shrink-0" onClick={() => setSheet({ publishing: publishing.filter((_,idx) => idx !== i) })}><FontAwesomeIcon icon={faXmark} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement terms + ownership split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 leading-relaxed">
              <strong className="text-sm text-gray-800">Agreement Terms:</strong>
              <p className="mt-1">Each contributor agrees to the ownership percentages specified above. All royalties will be distributed accordingly. Dispute resolution under the laws of <em>{sheet.stateCountry || "[State/Country]"}</em>. By signing, all parties acknowledge their contributions are accurately reflected.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <strong className="text-sm text-gray-800">Ownership Split:</strong>
              <OwnershipPie contributors={contributors} />
            </div>
          </div>

          {alert && <p className={`text-sm ${alertOk ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" disabled={isLoading} onClick={handleSave}>{isLoading ? "Saving…" : "Save"}</button>
            <button className="btn btn-outline" onClick={() => downloadSheetPDF(sheet)}>Download PDF</button>
            <button className="btn" onClick={() => { setView("list"); setEditingSheet(null); setAlert(""); }}>Cancel</button>
          </div>
        </div>

        {sigModal !== null && (
          <SignatureModal
            existing={(sheet.contributors as Contributor[])[sigModal]?.signature}
            onClose={() => setSigModal(null)}
            onSave={(data) => {
              setContributor(sigModal, { signature: data, signatureDate: new Date().toLocaleDateString("en-US") });
              setSigModal(null);
            }}
          />
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: "badge-ghost", sent: "badge-info", completed: "badge-success" };
    return <span className={`badge badge-sm ${map[s] ?? "badge-ghost"}`}>{s}</span>;
  };

  return (
    <div className="p-4 bg-white shadow rounded-md text-black">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Split Sheets</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline" onClick={() => { setView("contacts"); setAlert(""); }}>
            Contacts ({contacts.length})
          </button>
          {sheets.length < getMaxSheets() && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingSheet(BLANK_SHEET()); setView("form"); setAlert(""); }}>
              + New Sheet
            </button>
          )}
        </div>
      </div>

      {!user?.hasAccess && (
        <p className="text-xs text-gray-500 mb-3">
          {sheets.length} of {FREE_SPLIT_SHEET_LIMIT} free split sheets used
          {sheets.length >= FREE_SPLIT_SHEET_LIMIT && " — upgrade for unlimited"}
        </p>
      )}

      {alert && <p className={`text-sm mb-3 ${alertOk ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

      {sheets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3 text-gray-300"><FontAwesomeIcon icon={faFileLines} /></div>
          <p className="font-medium text-gray-600">No split sheets yet</p>
          <p className="text-sm mt-1">Hit <strong>+ New Sheet</strong> to create your first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sheets.map(s => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <OwnershipPie contributors={(s.contributors as Contributor[]) ?? []} size="small" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base">{s.title || "Untitled"}</h3>
                      {statusBadge(s.status)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.date && <span>{s.date} · </span>}
                      {s.artists && <span>{s.artists} · </span>}
                      {((s.contributors as any[]) ?? []).filter(c => c.name).length} contributor{((s.contributors as any[]) ?? []).filter(c => c.name).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-xs btn-outline" onClick={() => { setEditingSheet({ ...s, stateCountry: (s as any).state_country ?? "" }); setView("form"); setAlert(""); }}>Edit</button>
                  <button className="btn btn-xs btn-outline" onClick={() => downloadSheetPDF({ ...s, stateCountry: (s as any).state_country ?? "" })}>PDF</button>
                  <button className="btn btn-xs btn-info text-white" onClick={() => { setSendDialog(s.id); setAlert(""); }}>Send</button>
                  <button className="btn btn-xs btn-error" onClick={() => handleDeleteSheet(s.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sendDialog && (
        <SendDialog
          sheetId={sendDialog}
          contacts={contacts}
          onClose={() => setSendDialog(null)}
          onSent={async () => {
            setSendDialog(null);
            setAlert("Split sheet sent!", true);
            await loadSheets();
          }}
        />
      )}
    </div>
  );
}
