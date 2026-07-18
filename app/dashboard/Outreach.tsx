"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import apiClient from "@/libs/api";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
import posthog from "posthog-js";
import { renderNewsletterHtml } from "@/libs/newsletter-html";
import ImportContactsModal, { ImportField } from "@/components/ImportContactsModal";
import * as XLSX from "xlsx";
import NewsletterAnalytics from "@/components/NewsletterAnalytics";
import ImagePicker from "@/components/ImagePicker";

const IMPORT_FIELDS: ImportField[] = [
  { key: "email", label: "Email", aliases: ["e-mail", "mail"] },
  { key: "name", label: "Name", aliases: ["full name", "fullname"] },
  { key: "phone", label: "Phone", aliases: ["phone number", "tel", "mobile"] },
  { key: "instagram", label: "Instagram", aliases: ["ig", "insta"] },
  { key: "tiktok", label: "TikTok", aliases: ["tt", "tik tok"] },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface NLLink { name: string; url: string; type?: string; id?: string; image?: string; price?: string }
interface Newsletter {
  id: string; title: string; subject: string; template: string;
  image: string; description: string; links: NLLink[];
  bgColor: string; textColor: string; linksColor: string; urlRedirect: string;
  html: string; status: "draft" | "sent"; sentCount: number; lastSentAt: string | null; createdAt: string;
}
interface Contact { id: string; name: string; email: string; phone: string; instagram: string; tiktok: string; source: string }

const TEMPLATES = [
  { key: "blank", icon: "📝", label: "Blank", desc: "Start from scratch" },
  { key: "song_release", icon: "🎵", label: "Song", desc: "Announce a new single" },
  { key: "album_release", icon: "💿", label: "Album", desc: "Announce a new album" },
  { key: "music_video_release", icon: "🎬", label: "Music Video", desc: "Announce a new video" },
];

const TEMPLATE_SEED: Record<string, { title: string; subject: string; description: string }> = {
  blank: { title: "", subject: "", description: "" },
  song_release: { title: "My New Single is Out Now", subject: "🎵 New single out now!", description: "I just released a new song — give it a listen and let me know what you think!" },
  album_release: { title: "My New Album Has Arrived", subject: "💿 My new album is here!", description: "My new album is finally out. Stream it now on your favorite platform." },
  music_video_release: { title: "Watch My New Music Video", subject: "🎬 New music video!", description: "I just dropped a brand new music video — watch it now!" },
};

const blankNewsletter = (template: string): Partial<Newsletter> => {
  const seed = TEMPLATE_SEED[template] ?? TEMPLATE_SEED.blank;
  return {
    template,
    title: seed.title,
    subject: seed.subject,
    description: seed.description,
    image: "",
    links: template === "blank" ? [] : [{ name: "", url: "" }],
    bgColor: "#0f0f12",
    textColor: "#ffffff",
    linksColor: "#4f46e5",
    urlRedirect: "",
    status: "draft",
  };
};

// ─── Send dialog ──────────────────────────────────────────────────────────────

function SendDialog({ newsletterId, contacts, onClose, onSent }: { newsletterId: string; contacts: Contact[]; onClose: () => void; onSent: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState("");

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = contacts.length > 0 && selected.length === contacts.length;
  const selectAll = () => setSelected(contacts.map(c => c.id));
  const deselectAll = () => setSelected([]);

  const send = async () => {
    if (!selected.length) { setAlert("Select at least one contact"); return; }
    setSending(true);
    try {
      await apiClient.post(`/outreach/${newsletterId}/send`, { contactIds: selected });
      posthog.capture("newsletter_sent", { count: selected.length });
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
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Send Newsletter</h3>
            <p className="text-sm text-gray-500 mt-0.5">Select contacts to email</p>
          </div>
          {contacts.length > 0 && (
            <div className="flex gap-1">
              <button className="btn btn-xs btn-outline" onClick={selectAll} disabled={allSelected}>Select all</button>
              <button className="btn btn-xs btn-outline" onClick={deselectAll} disabled={selected.length === 0}>Deselect all</button>
            </div>
          )}
        </div>
        <div className="p-5 max-h-72 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No contacts yet. Add contacts first.</p>
          ) : contacts.map((c) => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
              <div>
                <p className="text-sm font-medium">{c.name || c.email}</p>
                <p className="text-xs text-gray-400">{c.email}</p>
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

export default function Outreach() {
  const [user, setUser] = useState<any>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [view, setView] = useState<"list" | "pick" | "form" | "contacts">("list");
  const [editing, setEditing] = useState<Partial<Newsletter> | null>(null);
  const [expandedAnalytics, setExpandedAnalytics] = useState<string | null>(null);
  const [sendDialog, setSendDialog] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState("");

  // Populate-from sources
  const [releasePages, setReleasePages] = useState<any[]>([]);
  const [linkInBioLinks, setLinkInBioLinks] = useState<NLLink[]>([]);
  const [linkInBioSelectedProducts, setLinkInBioSelectedProducts] = useState<string[]>([]);

  // Merch
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showMerchPicker, setShowMerchPicker] = useState(false);

  // Image gallery + quick-add toggle state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [showHeaderImagePicker, setShowHeaderImagePicker] = useState(false);
  const [socialLinksAdded, setSocialLinksAdded] = useState(false);
  const [linkInBioAdded, setLinkInBioAdded] = useState(false);

  useEffect(() => {
    apiClient.get("/get-user").then(r => setUser(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.hasAccess) return;
    loadNewsletters();
    loadContacts();
    fetch("/api/get-release-pages").then(r => r.json()).then(j => setReleasePages(Array.isArray(j?.data) ? j.data : [])).catch(() => {});
    fetch("/api/get-links").then(r => r.json()).then(j => {
      setLinkInBioLinks(Array.isArray(j?.data?.links) ? j.data.links : []);
      setLinkInBioSelectedProducts(Array.isArray(j?.data?.selectedProducts) ? j.data.selectedProducts : []);
    }).catch(() => {});
    fetch("/api/my-images").then(r => r.json()).then(j => setGalleryImages(Array.isArray(j?.images) ? j.images : [])).catch(() => {});
  }, [user?.hasAccess]);

  useEffect(() => {
    if (user?.printifyShopId && user?.id) fetchAvailableProducts();
  }, [user?.printifyShopId, user?.id]);

  const fetchAvailableProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const r = await fetch(`/api/products/${user.id}`);
      if (r.ok) {
        const d = await r.json();
        setAvailableProducts(Array.isArray(d) ? d : (d.products ?? []));
      }
    } catch (_e) { /* silent */ } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadNewsletters = async () => {
    try { const r = await apiClient.get("/outreach"); setNewsletters(r.data ?? []); } catch {}
  };
  const loadContacts = async () => {
    try { const r = await apiClient.get("/outreach-contacts"); setContacts(r.data ?? []); } catch {}
  };

  // ── Export contacts ──
  const contactsToCsv = () => {
    const headers = ["name", "email", "phone", "instagram", "tiktok", "source"];
    const esc = (v: any) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [headers.join(",")];
    for (const c of contacts) lines.push([c.name, c.email, c.phone, c.instagram, c.tiktok, c.source].map(esc).join(","));
    return lines.join("\n");
  };
  const exportCsv = () => {
    const blob = new Blob([contactsToCsv()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "outreach-contacts.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const exportXlsx = () => {
    const headers = ["name", "email", "phone", "instagram", "tiktok", "source"];
    const rows = contacts.map(c => [c.name, c.email, c.phone, c.instagram, c.tiktok, c.source]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "outreach-contacts.xlsx");
  };
  const copyContacts = async () => {
    try { await navigator.clipboard.writeText(contactsToCsv()); setAlert("✅ Contacts copied to clipboard"); }
    catch { setAlert("Could not copy"); }
  };

  // ── Builder helpers ──────────────────────────────────────────────────────────

  const nl = editing ?? blankNewsletter("blank");
  const setNl = (patch: Partial<Newsletter>) => setEditing(prev => ({ ...(prev ?? blankNewsletter("blank")), ...patch }));
  const links = (nl.links ?? []) as NLLink[];
  const regularLinks = links.filter(l => l.type !== "merch" && l.type !== "youtube");
  const selectedMerchIds = links.filter(l => l.type === "merch").map(l => l.id!);
  const youtubeLinkEntry = links.find(l => l.type === "youtube");
  const setYoutubeLink = (url: string) => {
    const without = links.filter(l => l.type !== "youtube");
    setNl({ links: url.trim() ? [...without, { name: "Watch on YouTube", url: url.trim(), type: "youtube" }] : without });
  };
  const setLink = (i: number, patch: Partial<NLLink>) => {
    const target = regularLinks[i];
    setNl({ links: links.map(l => l === target ? { ...l, ...patch } : l) });
  };

  const productToMerchLink = (p: any): NLLink => ({
    type: "merch", id: p.id, name: p.title || "Product",
    url: p.url || "", image: p.images?.[0] || "", price: p.variants?.[0]?.price || "",
  });

  const toggleMerch = (product: any) => {
    const isSelected = selectedMerchIds.includes(product.id);
    if (isSelected) {
      setNl({ links: links.filter(l => !(l.type === "merch" && l.id === product.id)) });
    } else {
      if (selectedMerchIds.length >= 10) return;
      setNl({ links: [...links, productToMerchLink(product)] });
    }
  };

  const buildMerchLinks = (productIds: string[]) =>
    productIds
      .map(id => availableProducts.find((p: any) => p.id === id))
      .filter(Boolean)
      .map(productToMerchLink);

  const populateFrom = (value: string) => {
    if (!value) return;
    if (value === "link-in-bio") {
      const bioUrl = user?.username ? `https://${config.domainName}/${user.username}` : "";
      const bioLinks = linkInBioLinks.map(l => ({ name: l.name || "", url: l.url || "" }));
      const merch = buildMerchLinks(linkInBioSelectedProducts);
      setNl({ links: [...bioLinks, ...merch], urlRedirect: bioUrl });
      setLinkInBioAdded(true);
      setAlert("✅ Pulled links from your Link in Bio");
      return;
    }
    const rp = releasePages.find(p => String(p.id) === value);
    if (rp) {
      const rpLinks = (rp.links ?? []).map((l: any) => ({ name: l.name || "", url: l.url || "" }));
      const merch = buildMerchLinks(rp.selectedProducts ?? []);
      const ytLink = rp.video ? [{ type: "youtube", name: "Watch on YouTube", url: rp.video }] : [];
      setNl({
        image: rp.image || nl.image || "",
        description: rp.description || nl.description || "",
        links: [...ytLink, ...rpLinks, ...merch],
        bgColor: rp.bgColor || nl.bgColor,
        textColor: rp.textColor || nl.textColor,
        linksColor: rp.linksColor || nl.linksColor,
        urlRedirect: rp.name ? `https://${config.domainName}/release/${encodeURIComponent(rp.name)}` : "",
      });
      setAlert(`✅ Pulled content from "${rp.name}"`);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!nl.title?.trim()) { setAlert("Give your newsletter a title"); return; }
    setIsLoading(true);
    try {
      const payload = {
        title: nl.title, subject: nl.subject, template: nl.template,
        image: nl.image, description: nl.description, links: nl.links,
        bgColor: nl.bgColor, textColor: nl.textColor, linksColor: nl.linksColor,
        urlRedirect: nl.urlRedirect,
      };
      if ((nl as any).id) {
        await apiClient.put(`/outreach/${(nl as any).id}`, payload);
      } else {
        await apiClient.post("/outreach", payload);
        posthog.capture("newsletter_created", { template: nl.template });
      }
      await loadNewsletters();
      setView("list");
      setEditing(null);
      setAlert("");
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this newsletter?")) return;
    try {
      await apiClient.delete(`/outreach/${id}`);
      setNewsletters(newsletters.filter(n => n.id !== id));
    } catch { setAlert("Delete failed"); }
  };

  // ── Contacts ────────────────────────────────────────────────────────────────

  const handleSaveContact = async () => {
    if (!contactForm.email?.trim()) { setAlert("Email is required"); return; }
    try {
      if (editingContact) {
        const r = await apiClient.put(`/outreach-contacts/${editingContact}`, contactForm);
        setContacts(contacts.map(c => c.id === editingContact ? r.data : c));
      } else {
        const r = await apiClient.post("/outreach-contacts", contactForm);
        setContacts(prev => [r.data, ...prev.filter(c => c.id !== r.data.id)]);
      }
      setContactForm({}); setEditingContact(null); setAlert("");
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Save failed");
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await apiClient.delete(`/outreach-contacts/${id}`);
      setContacts(contacts.filter(c => c.id !== id));
    } catch { setAlert("Delete failed"); }
  };

  // ── Premium gate ───────────────────────────────────────────────────────────────

  if (user && !user.hasAccess) {
    return (
      <div className="p-6 bg-white shadow rounded-md text-black">
        <h2 className="text-xl font-bold mb-2">Outreach</h2>
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg text-center">
          <div className="text-4xl mb-3">📣</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Outreach is a Premium Feature</h3>
          <p className="text-sm text-gray-600 mb-4">Build email newsletters, collect fans from your pages, and send release announcements to your audience.</p>
          <ButtonCheckout mode="subscription" priceId={config.stripe.plans[1].priceId} />
        </div>
      </div>
    );
  }

  // ── Template picker ─────────────────────────────────────────────────────────

  if (view === "pick") {
    return (
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Choose a Template</h2>
          <button className="btn btn-sm" onClick={() => setView("list")}>← Back</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          {TEMPLATES.map(t => (
            <button key={t.key}
              onClick={() => { setEditing(blankNewsletter(t.key)); setView("form"); setAlert(""); }}
              className="text-left border border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs text-gray-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Contacts view ─────────────────────────────────────────────────────────

  if (view === "contacts") {
    const sourceBadge = (s: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        manual: { label: "Manual", cls: "badge-ghost" },
        link_in_bio: { label: "Influanto", cls: "badge-info" },
        release_page: { label: "Influanto", cls: "badge-success" },
      };
      const b = map[s] ?? map.manual;
      return <span className={`badge badge-xs ${b.cls}`}>{b.label}</span>;
    };

    return (
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold">Contacts</h2>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-outline" onClick={() => { setShowImport(true); setAlert(""); }}>⬆ Import</button>
            <button className="btn btn-sm btn-outline" disabled={!contacts.length} onClick={exportCsv}>⬇ Export CSV</button>
            <button className="btn btn-sm btn-outline" disabled={!contacts.length} onClick={exportXlsx}>⬇ Export XLSX</button>
            <button className="btn btn-sm btn-outline" disabled={!contacts.length} onClick={copyContacts}>📋 Copy Contacts</button>
            <button className="btn btn-sm" onClick={() => { setView("list"); setContactForm({}); setEditingContact(null); setAlert(""); }}>← Back</button>
          </div>
        </div>

        {showImport && (
          <ImportContactsModal
            title="Import Contacts"
            fields={IMPORT_FIELDS}
            onClose={() => setShowImport(false)}
            onImport={async (rows) => {
              const r = await apiClient.post("/outreach-contacts/import", { contacts: rows });
              posthog.capture("outreach_contacts_imported", { count: (r as any)?.added ?? rows.length });
              await loadContacts();
              return r as any;
            }}
          />
        )}

        {/* Add / edit contact form */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm mb-3">{editingContact ? "Edit Contact" : "Add Contact"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input className="input input-sm input-bordered w-full" placeholder="Full name" value={contactForm.name ?? ""} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email *</label>
              <input className="input input-sm input-bordered w-full" type="email" placeholder="email@example.com" value={contactForm.email ?? ""} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone</label>
              <input className="input input-sm input-bordered w-full" placeholder="Optional" value={contactForm.phone ?? ""} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Instagram</label>
              <input className="input input-sm input-bordered w-full" placeholder="@handle" value={contactForm.instagram ?? ""} onChange={e => setContactForm(p => ({ ...p, instagram: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">TikTok</label>
              <input className="input input-sm input-bordered w-full" placeholder="@handle" value={contactForm.tiktok ?? ""} onChange={e => setContactForm(p => ({ ...p, tiktok: e.target.value }))} />
            </div>
          </div>
          {alert && <p className="text-xs text-red-500 mt-2">{alert}</p>}
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary btn-sm" onClick={handleSaveContact}>{editingContact ? "Update" : "Add Contact"}</button>
            {editingContact && <button className="btn btn-sm" onClick={() => { setEditingContact(null); setContactForm({}); }}>Cancel</button>}
          </div>
        </div>

        {/* Contacts list */}
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No contacts yet — add them above or collect them from your pages</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3 gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2 flex-wrap">{c.name || "—"} {sourceBadge(c.source)}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""}{c.instagram ? ` · IG ${c.instagram}` : ""}{c.tiktok ? ` · TT ${c.tiktok}` : ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn btn-xs btn-outline" onClick={() => { setEditingContact(c.id); setContactForm({ name: c.name, email: c.email, phone: c.phone, instagram: c.instagram, tiktok: c.tiktok }); }}>Edit</button>
                  <button className="btn btn-xs btn-error" onClick={() => handleDeleteContact(c.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Builder (create / edit) ─────────────────────────────────────────────────

  if (view === "form") {
    const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
      instagram: "Instagram", twitter: "Twitter", facebook: "Facebook",
      youtube: "YouTube", tiktok: "TikTok", spotify: "Spotify",
      soundcloud: "SoundCloud", youtubeMusic: "YouTube Music", website: "Website",
    };
    const SOCIAL_PLATFORMS = Object.keys(SOCIAL_PLATFORM_LABELS);

    const addSocialLinksBlock = () => {
      const newLinks = SOCIAL_PLATFORMS
        .filter(k => user?.[k])
        .map(k => ({ name: SOCIAL_PLATFORM_LABELS[k], url: user[k] }));
      if (!newLinks.length) return;
      setNl({ links: [...links.filter(l => l.name || l.url), ...newLinks] });
      setSocialLinksAdded(true);
      setAlert("✅ Social links added");
    };

    const removeSocialLinksBlock = () => {
      const socialNames = new Set(Object.values(SOCIAL_PLATFORM_LABELS));
      setNl({ links: links.filter(l => !socialNames.has(l.name)) });
      setSocialLinksAdded(false);
    };

    const hasSocials = SOCIAL_PLATFORMS.some(k => user?.[k]);

    const previewHtml = renderNewsletterHtml({
      title: nl.title, template: nl.template, image: nl.image, description: nl.description,
      links: links, bgColor: nl.bgColor, textColor: nl.textColor, linksColor: nl.linksColor,
      urlRedirect: nl.urlRedirect,
    }, {
      senderName: user?.name || "You",
      socials: {
        instagram: user?.instagram, twitter: user?.twitter, facebook: user?.facebook,
        youtube: user?.youtube, tiktok: user?.tiktok, spotify: user?.spotify,
        soundcloud: user?.soundcloud, youtubeMusic: user?.youtubeMusic, website: user?.website,
      },
      artistImage: user?.image,
    });

    return (
      <>
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{(nl as any).id ? "Edit Newsletter" : "New Newsletter"}</h2>
          <button className="btn btn-sm" onClick={() => { setView("list"); setEditing(null); setAlert(""); }}>← Back</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            {/* Populate from */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <label className="block text-xs font-semibold mb-1 text-indigo-700">Populate content from</label>
              <select className="select select-sm select-bordered w-full" defaultValue="" onChange={e => { populateFrom(e.target.value); e.target.value = ""; }}>
                <option value="">Choose a source…</option>
                {linkInBioLinks.length > 0 && <option value="link-in-bio">Link in Bio ({linkInBioLinks.length} links)</option>}
                {releasePages.map(p => <option key={p.id} value={String(p.id)}>Release Page: {p.name}</option>)}
              </select>
              <p className="text-[11px] text-indigo-400 mt-1">Pulls image, description &amp; links — you can edit after.</p>
            </div>

            {/* Blank template quick-add blocks */}
            {nl.template === "blank" && (hasSocials || linkInBioLinks.length > 0 || true) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <label className="block text-xs font-semibold mb-2 text-gray-600">Quick add to blank email</label>
                <div className="flex flex-wrap gap-2">
                  {hasSocials && (
                    socialLinksAdded
                      ? <button type="button" className="btn btn-xs btn-outline text-red-500 border-red-300" onClick={removeSocialLinksBlock}>− Social Links</button>
                      : <button type="button" className="btn btn-xs btn-outline" onClick={addSocialLinksBlock}>+ Social Links</button>
                  )}
                  {linkInBioLinks.length > 0 && (
                    linkInBioAdded
                      ? <button type="button" className="btn btn-xs btn-outline text-red-500 border-red-300" onClick={() => { setNl({ links: links.filter(l => l.type === "merch" || l.type === "youtube") }); setLinkInBioAdded(false); }}>− Link in Bio</button>
                      : <button type="button" className="btn btn-xs btn-outline" onClick={() => populateFrom("link-in-bio")}>+ Link in Bio</button>
                  )}
                  {nl.image
                    ? <button type="button" className="btn btn-xs btn-outline text-red-500 border-red-300" onClick={() => setNl({ image: "" })}>− Photo</button>
                    : <button type="button" className="btn btn-xs btn-outline" onClick={() => setShowHeaderImagePicker(true)}>+ Photo</button>
                  }
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Social icons &amp; your brand photo always appear in the email footer automatically.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input className="input input-bordered w-full" placeholder="Newsletter title (shown in the email)" value={nl.title ?? ""} onChange={e => setNl({ title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Subject</label>
              <input className="input input-bordered w-full" placeholder="Subject line recipients see" value={nl.subject ?? ""} onChange={e => setNl({ subject: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Header Image URL</label>
              <input className="input input-bordered w-full" placeholder="https://…/cover.jpg" value={nl.image ?? ""} onChange={e => setNl({ image: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea className="textarea textarea-bordered w-full" rows={4} placeholder="Tell your fans what's new…" value={nl.description ?? ""} onChange={e => setNl({ description: e.target.value })} />
            </div>
            {(nl.template === "song_release" || nl.template === "album_release" || nl.template === "music_video_release") && (
              <div>
                <label className="block text-sm font-medium mb-1">YouTube Video / Playlist</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="https://youtube.com/watch?v=… or playlist link"
                  value={youtubeLinkEntry?.url ?? ""}
                  onChange={e => setYoutubeLink(e.target.value)}
                />
                <p className="text-[11px] text-gray-400 mt-1">Shows a clickable thumbnail above your links. Auto-filled from your release page.</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">URL Redirect</label>
              <input className="input input-bordered w-full" placeholder="https://… (makes the image, title & description clickable)" value={nl.urlRedirect ?? ""} onChange={e => setNl({ urlRedirect: e.target.value })} />
              <p className="text-[11px] text-gray-400 mt-1">Wraps the header image, title and description in one link. Auto-filled when you populate from Link in Bio or a Release Page.</p>
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Links</label>
                <button type="button" className="btn btn-xs btn-outline" onClick={() => setNl({ links: [...links, { name: "", url: "" }] })}>+ Add Link</button>
              </div>
              <div className="space-y-2">
                {regularLinks.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input input-sm input-bordered flex-1" placeholder="Label (e.g. Spotify)" value={l.name} onChange={e => setLink(i, { name: e.target.value })} />
                    <input className="input input-sm input-bordered flex-1" placeholder="https://…" value={l.url} onChange={e => setLink(i, { url: e.target.value })} />
                    <button type="button" className="btn btn-xs btn-error" onClick={() => setNl({ links: links.filter(x => x !== l) })}>✕</button>
                  </div>
                ))}
                {regularLinks.length === 0 && <p className="text-xs text-gray-400">No links yet</p>}
              </div>
            </div>

            {/* Merch */}
            {user?.printifyShopId && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-purple-800">🛒 Merch</span>
                    {selectedMerchIds.length > 0 && <span className="ml-2 text-xs text-purple-600">{selectedMerchIds.length} selected</span>}
                  </div>
                  <button type="button" className="btn btn-xs btn-outline border-purple-400 text-purple-700" onClick={() => setShowMerchPicker(p => !p)}>
                    {showMerchPicker ? "Hide" : "Select Products"}
                  </button>
                </div>
                {selectedMerchIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {links.filter(l => l.type === "merch").map(l => (
                      <div key={l.id} className="flex items-center gap-1 bg-white border border-purple-200 rounded-full px-2 py-0.5 text-xs">
                        {l.image && <img src={l.image} alt="" className="w-4 h-4 rounded-full object-cover" />}
                        <span className="text-purple-800 font-medium truncate max-w-[100px]">{l.name}</span>
                        <button type="button" onClick={() => setNl({ links: links.filter(x => x !== l) })} className="text-purple-400 hover:text-red-500 ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {showMerchPicker && (
                  <div className="mt-2 border-t border-purple-200 pt-3">
                    {isLoadingProducts ? (
                      <p className="text-xs text-purple-600 text-center py-4">Loading products…</p>
                    ) : availableProducts.length === 0 ? (
                      <p className="text-xs text-purple-600 text-center py-4">No products found in your Printify store.</p>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-purple-600">{selectedMerchIds.length}/10 selected</span>
                          {selectedMerchIds.length > 0 && (
                            <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => setNl({ links: links.filter(l => l.type !== "merch") })}>Clear all</button>
                          )}
                        </div>
                        <div className="border border-purple-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                          {/* Mobile cards */}
                          <div className="md:hidden space-y-2 p-2">
                            {availableProducts.map((p: any) => (
                              <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer ${selectedMerchIds.includes(p.id) ? "bg-purple-50 border-purple-400" : "bg-white border-gray-200"}`} onClick={() => toggleMerch(p)}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedMerchIds.includes(p.id) ? "bg-purple-500 border-purple-500" : "bg-white border-gray-300"}`}>
                                  {selectedMerchIds.includes(p.id) && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </div>
                                {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{p.title}</p>
                                  <p className="text-xs text-green-600 font-semibold">${p.variants?.[0]?.price || "—"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop table */}
                          <table className="hidden md:table w-full">
                            <tbody className="bg-white divide-y divide-gray-100">
                              {availableProducts.map((p: any) => (
                                <tr key={p.id} className={`cursor-pointer hover:bg-gray-50 ${selectedMerchIds.includes(p.id) ? "bg-purple-50" : ""}`} onClick={() => toggleMerch(p)}>
                                  <td className="px-2 py-2 w-6">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedMerchIds.includes(p.id) ? "bg-purple-500 border-purple-500" : "bg-white border-gray-300"}`}>
                                      {selectedMerchIds.includes(p.id) && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 w-12">{p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded object-cover" />}</td>
                                  <td className="px-2 py-2 text-sm font-medium text-gray-900">{p.title?.length > 60 ? p.title.slice(0, 60) + "…" : p.title}</td>
                                  <td className="px-2 py-2 text-sm font-semibold text-green-600 whitespace-nowrap">${p.variants?.[0]?.price || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Colors */}
            <div className="grid grid-cols-3 gap-3">
              {([["bgColor", "Background"], ["textColor", "Text"], ["linksColor", "Buttons"]] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1">{label}</label>
                  <input type="color" className="w-full h-9 rounded border border-gray-200 cursor-pointer" value={(nl as any)[key] || "#000000"} onChange={e => setNl({ [key]: e.target.value } as any)} />
                </div>
              ))}
            </div>

            {alert && <p className={`text-sm ${alert.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-primary" disabled={isLoading} onClick={handleSave}>{isLoading ? "Saving…" : "Save"}</button>
              <button className="btn" onClick={() => { setView("list"); setEditing(null); setAlert(""); }}>Cancel</button>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Email Preview</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </div>

      {showHeaderImagePicker && (
        <ImagePicker
          images={galleryImages}
          uploadPreset="ReleasePageImages"
          uploadOptions={{ publicId: `user_${user?.id}_newsletter_${Date.now()}` }}
          title="Choose a header photo"
          onUploaded={(result: any) => {
            const url = result.info?.secure_url || "";
            setNl({ image: url });
            setGalleryImages(prev => [url, ...prev.filter(i => i !== url)]);
            setShowHeaderImagePicker(false);
          }}
          onSelect={(url: string) => { setNl({ image: url }); setShowHeaderImagePicker(false); }}
          onClose={() => setShowHeaderImagePicker(false)}
        />
      )}
      </>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────

  const statusBadge = (s: string) => (
    <span className={`badge badge-sm ${s === "sent" ? "badge-success" : "badge-ghost"}`}>{s}</span>
  );

  return (
    <div className="p-4 bg-white shadow rounded-md text-black">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Outreach</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline" onClick={() => { setView("contacts"); setAlert(""); }}>
            Contacts ({contacts.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setView("pick"); setAlert(""); }}>
            + New Newsletter
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">Create email newsletters and send them to contacts you collect from your Link in Bio and Release pages.</p>

      {alert && <p className={`text-sm mb-3 ${alert.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

      {newsletters.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📣</div>
          <p className="font-medium text-gray-600">No newsletters yet</p>
          <p className="text-sm mt-1">Hit <strong>+ New Newsletter</strong> to create your first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newsletters.map(n => (
            <div key={n.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base">{n.title || "Untitled"}</h3>
                    {statusBadge(n.status)}
                    <span className="badge badge-xs badge-outline">{TEMPLATES.find(t => t.key === n.template)?.label ?? n.template}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {n.subject && <span>{n.subject} · </span>}
                    {(n.sentCount ?? 0)} contact{(n.sentCount ?? 0) !== 1 ? "s" : ""}
                    {n.lastSentAt && <span> · sent {new Date(n.lastSentAt).toLocaleDateString()}</span>}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-xs btn-outline" onClick={() => { setEditing(n); setView("form"); setAlert(""); }}>Edit</button>
                  <button className="btn btn-xs btn-info text-white" onClick={() => { setSendDialog(n.id); setAlert(""); }}>{n.status === "sent" ? "Resend" : "Send"}</button>
                  <button className={`btn btn-xs ${expandedAnalytics === n.id ? "btn-primary text-white" : "btn-outline"}`} onClick={() => { setExpandedAnalytics(expandedAnalytics === n.id ? null : n.id); setAlert(""); }}>
                    {expandedAnalytics === n.id ? "Hide Analytics" : "Analytics"}
                  </button>
                  <button className="btn btn-xs btn-error" onClick={() => handleDelete(n.id)}>Delete</button>
                </div>
              </div>

              {/* Collapsible analytics panel */}
              {expandedAnalytics === n.id && (
                <div className="border-t border-gray-200 mt-3 -mx-4 px-4">
                  <NewsletterAnalytics newsletterId={n.id} title={n.title} embedded />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {sendDialog && (
        <SendDialog
          newsletterId={sendDialog}
          contacts={contacts}
          onClose={() => setSendDialog(null)}
          onSent={async () => {
            setSendDialog(null);
            setAlert("✅ Newsletter sent!");
            await loadNewsletters();
          }}
        />
      )}
    </div>
  );
}
