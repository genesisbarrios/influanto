"use client";
/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import apiClient from "@/libs/api";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
import posthog from "posthog-js";
import { PLATFORMS, platformsForKind, Platform, PostKind, PLATFORM_LABEL, IMAGE_RATIOS } from "@/libs/crosspost/constants";
import { validateMedia, closestImageRatio } from "@/libs/crosspost/validate";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaItem { url: string; width?: number; height?: number; duration?: number }
interface Account { id: string; platform: Platform; handle: string; connected: boolean }
interface Post {
  id: string; kind: PostKind; media: MediaItem[]; caption: string;
  platforms: Platform[]; settings: Record<string, any>; status: string; results: Record<string, any>;
}

// ─── Media helpers ────────────────────────────────────────────────────────────
function readMediaMeta(file: File, kind: PostKind): Promise<{ width?: number; height?: number; duration?: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    if (kind === "image") {
      const img = new Image();
      img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { resolve({}); URL.revokeObjectURL(url); };
      img.src = url;
    } else {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration }); URL.revokeObjectURL(url); };
      v.onerror = () => { resolve({}); URL.revokeObjectURL(url); };
      v.src = url;
    }
  });
}

// Center-crop an image File to a target ratio (width/height). No editor — auto.
function autoCropImage(file: File, ratio: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const cur = img.naturalWidth / img.naturalHeight;
      let cw = img.naturalWidth, ch = img.naturalHeight;
      if (cur > ratio) cw = Math.round(img.naturalHeight * ratio); // too wide → trim sides
      else ch = Math.round(img.naturalWidth / ratio); // too tall → trim top/bottom
      const sx = Math.round((img.naturalWidth - cw) / 2);
      const sy = Math.round((img.naturalHeight - ch) / 2);
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      canvas.getContext("2d")!.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (!blob) return reject(new Error("Crop failed"));
        resolve(new File([blob], file.name.replace(/\.\w+$/, "") + "_cropped.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image")); };
    img.src = url;
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Crossposting() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<"list" | "compose">("list");

  // composer
  const [kind, setKind] = useState<PostKind>("image");
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<Platform[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [alert, setAlert] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  // connect modal
  const [connectModal, setConnectModal] = useState<Platform | null>(null);
  const [connectForm, setConnectForm] = useState<{ handle: string; token: string }>({ handle: "", token: "" });

  useEffect(() => { apiClient.get("/get-user").then(r => setUser(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!user?.hasAccess) return;
    loadPosts(); loadAccounts();
  }, [user?.hasAccess]);

  const loadPosts = async () => { try { const r = await apiClient.get("/crossposts"); setPosts(r.data ?? []); } catch {} };
  const loadAccounts = async () => { try { const r = await apiClient.get("/crosspost-accounts"); setAccounts(r.data ?? []); } catch {} };

  const accountFor = (p: Platform) => accounts.find(a => a.platform === p);
  const warnings = media ? validateMedia(kind, media, selected) : [];

  // ── Compose helpers ──
  const resetCompose = () => { setKind("image"); setMedia(null); setCaption(""); setSelected([]); setSettings({}); setEditingId(null); setLastFile(null); setAlert(""); };

  const startNew = () => { resetCompose(); setView("compose"); };

  const startEdit = (p: Post) => {
    setKind(p.kind); setMedia(p.media?.[0] ?? null); setCaption(p.caption);
    setSelected(p.platforms ?? []); setSettings(p.settings ?? {}); setEditingId(p.id);
    setLastFile(null); setAlert(""); setView("compose");
  };

  const changeKind = (k: PostKind) => {
    setKind(k); setMedia(null); setLastFile(null);
    setSelected(prev => prev.filter(p => platformsForKind(k).some(m => m.key === p)));
  };

  const togglePlatform = (p: Platform) =>
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const setSetting = (p: Platform, key: string, val: any) =>
    setSettings(prev => ({ ...prev, [p]: { ...(prev[p] ?? {}), [key]: val } }));

  // ── Upload ──
  const doUpload = async (file: File) => {
    setUploading(true); setAlert(""); setLastFile(file);
    try {
      const meta = await readMediaMeta(file, kind);
      const r: any = await apiClient.post("/crossposts/upload-url", { fileName: file.name, contentType: file.type });
      const put = await fetch(r.uploadUrl, { method: "PUT", headers: { "content-type": file.type, "x-upsert": "true" }, body: file });
      if (!put.ok) throw new Error("Upload failed");
      setMedia({ url: r.publicUrl, ...meta });
    } catch (e: any) {
      setAlert(e?.response?.data?.error || e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (file?: File) => { if (file) doUpload(file); };

  const doAutoCrop = async (ratio: number) => {
    if (!lastFile) { setAlert("Re-select the image to auto-crop"); return; }
    try { const cropped = await autoCropImage(lastFile, ratio); await doUpload(cropped); }
    catch (e: any) { setAlert(e?.message || "Auto-crop failed"); }
  };

  // ── Save / publish ──
  const buildPayload = () => ({ kind, media: media ? [media] : [], caption, platforms: selected, settings });

  const save = async (): Promise<Post | null> => {
    if (!media) { setAlert("Upload an image or video first"); return null; }
    if (!selected.length) { setAlert("Select at least one platform"); return null; }
    try {
      const payload = buildPayload();
      const r: any = editingId
        ? await apiClient.put(`/crossposts/${editingId}`, payload)
        : await apiClient.post("/crossposts", payload);
      const saved = r.data as Post;
      setEditingId(saved.id);
      await loadPosts();
      return saved;
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Save failed"); return null;
    }
  };

  const handleSaveDraft = async () => { const s = await save(); if (s) { setAlert("✅ Draft saved"); } };

  const handlePublish = async () => {
    setPublishing(true); setAlert("");
    try {
      const saved = await save();
      if (!saved) return;
      const r: any = await apiClient.post(`/crossposts/${saved.id}/publish`, {});
      posthog.capture("crosspost_published", { platforms: selected, kind });
      await loadPosts();
      const statuses = Object.values(r.results ?? {}).map((x: any) => x.status);
      if (statuses.includes("published")) setAlert("✅ Published!");
      else setAlert("Saved. Some platforms are pending connection/approval — see status below.");
      setView("list");
      resetCompose();
    } catch (e: any) {
      setAlert(e?.response?.data?.error || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try { await apiClient.delete(`/crossposts/${id}`); setPosts(posts.filter(p => p.id !== id)); } catch { setAlert("Delete failed"); }
  };

  // ── Accounts ──
  const submitConnect = async () => {
    if (!connectModal) return;
    try {
      await apiClient.post("/crosspost-accounts", { platform: connectModal, handle: connectForm.handle, credentials: connectForm.token ? { accessToken: connectForm.token } : {} });
      setConnectModal(null); setConnectForm({ handle: "", token: "" });
      await loadAccounts();
    } catch (e: any) { setAlert(e?.response?.data?.error || "Connect failed"); }
  };

  const disconnect = async (p: Platform) => {
    try { await apiClient.delete(`/crosspost-accounts/${p}`); await loadAccounts(); } catch {}
  };

  // ── Premium gate ──
  if (user && !user.hasAccess) {
    return (
      <div className="p-6 bg-white shadow rounded-md text-black">
        <h2 className="text-xl font-bold mb-2">Crossposting</h2>
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg text-center">
          <div className="text-4xl mb-3">🔁</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Crossposting is a Premium Feature</h3>
          <p className="text-sm text-gray-600 mb-4">Post once and publish to Instagram, TikTok, and YouTube Shorts from a single screen.</p>
          <ButtonCheckout mode="subscription" priceId={config.stripe.plans[1].priceId} />
        </div>
      </div>
    );
  }

  // ── Compose view ──
  if (view === "compose") {
    const available = platformsForKind(kind);
    return (
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{editingId ? "Edit Post" : "New Post"}</h2>
          <button className="btn btn-sm" onClick={() => { setView("list"); resetCompose(); }}>← Back</button>
        </div>

        <div className="space-y-5 max-w-2xl">
          {/* Kind */}
          <div className="flex gap-2">
            {(["image", "video"] as PostKind[]).map(k => (
              <button key={k} onClick={() => changeKind(k)}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium ${kind === k ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}>
                {k === "image" ? "🖼️ Image post" : "🎬 Video (Reels / TikTok / Shorts)"}
              </button>
            ))}
          </div>

          {/* Media */}
          <div>
            <label className="block text-sm font-medium mb-1">Media</label>
            {media ? (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-center mb-2 bg-gray-50 rounded">
                  {kind === "image"
                    ? <img src={media.url} alt="" className="max-h-60 object-contain" />
                    : <video src={media.url} controls className="max-h-60" />}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{media.width}×{media.height}{media.duration ? ` · ${Math.round(media.duration)}s` : ""}</span>
                  <button className="btn btn-xs btn-outline" onClick={() => fileRef.current?.click()}>Replace</button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-10 text-sm text-gray-500 hover:bg-gray-50">
                {uploading ? "Uploading…" : `Click to upload ${kind === "image" ? "an image" : "a video"}`}
              </button>
            )}
            <input ref={fileRef} type="file" className="hidden" accept={kind === "image" ? "image/*" : "video/*"}
              onChange={e => onPickFile(e.target.files?.[0])} />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-1">Caption</label>
            <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="Write a caption…" value={caption} onChange={e => setCaption(e.target.value)} />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium mb-2">Post to</label>
            <div className="flex flex-wrap gap-2">
              {available.map(p => {
                const acct = accountFor(p.key);
                const on = selected.includes(p.key);
                return (
                  <button key={p.key} onClick={() => togglePlatform(p.key)}
                    className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${on ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}>
                    <span>{p.icon}</span>{p.label}{p.videoLabel && kind === "video" ? ` ${p.videoLabel}` : ""}
                    {!acct?.connected && <span className="badge badge-xs badge-warning">connect</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warnings + auto-crop */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              {warnings.map((w, i) => <div key={i}>⚠️ {w.message}</div>)}
              {kind === "image" && media?.width && media?.height && (
                <div className="flex gap-2 mt-2">
                  {IMAGE_RATIOS.map(r => (
                    <button key={r.label} className="btn btn-xs btn-outline" onClick={() => doAutoCrop(r.ratio)}>Auto-crop {r.label.split(" ")[0]}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per-platform settings */}
          {selected.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Platform settings</p>
              {selected.map(p => (
                <div key={p} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold mb-2">{PLATFORM_LABEL[p]}</p>
                  {p === "youtube" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input className="input input-sm input-bordered" placeholder="Title" value={settings.youtube?.title ?? ""} onChange={e => setSetting("youtube", "title", e.target.value)} />
                      <select className="select select-sm select-bordered" value={settings.youtube?.privacy ?? "public"} onChange={e => setSetting("youtube", "privacy", e.target.value)}>
                        <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
                      </select>
                    </div>
                  )}
                  {p === "tiktok" && (
                    <div className="flex flex-wrap items-center gap-3">
                      <select className="select select-sm select-bordered" value={settings.tiktok?.privacy ?? "PUBLIC_TO_EVERYONE"} onChange={e => setSetting("tiktok", "privacy", e.target.value)}>
                        <option value="PUBLIC_TO_EVERYONE">Public</option><option value="MUTUAL_FOLLOW_FRIENDS">Friends</option><option value="SELF_ONLY">Private</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="checkbox checkbox-xs" checked={settings.tiktok?.allowComments ?? true} onChange={e => setSetting("tiktok", "allowComments", e.target.checked)} />Allow comments</label>
                    </div>
                  )}
                  {p === "instagram" && (
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" className="checkbox checkbox-xs" checked={settings.instagram?.shareToFeed ?? true} onChange={e => setSetting("instagram", "shareToFeed", e.target.checked)} />
                      {kind === "video" ? "Also share Reel to feed" : "Share to feed"}
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}

          {alert && <p className={`text-sm ${alert.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" disabled={publishing || uploading} onClick={handlePublish}>{publishing ? "Publishing…" : "Publish"}</button>
            <button className="btn btn-outline" disabled={uploading} onClick={handleSaveDraft}>Save Draft</button>
            <button className="btn" onClick={() => { setView("list"); resetCompose(); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  const resultBadge = (status: string) => {
    const map: Record<string, string> = { published: "badge-success", failed: "badge-error", pending: "badge-warning", skipped: "badge-ghost" };
    return map[status] ?? "badge-ghost";
  };

  return (
    <div className="p-4 bg-white shadow rounded-md text-black">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Crossposting</h2>
        <button className="btn btn-primary btn-sm" onClick={startNew}>+ New Post</button>
      </div>

      {/* Connected accounts */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-600 mb-2">Connected accounts</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const acct = accountFor(p.key);
            return (
              <div key={p.key} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <span>{p.icon}</span><span>{p.label}</span>
                {acct?.connected ? (
                  <>
                    <span className="badge badge-xs badge-success">connected{acct.handle ? `: ${acct.handle}` : ""}</span>
                    <button className="text-xs text-red-500 underline" onClick={() => disconnect(p.key)}>disconnect</button>
                  </>
                ) : (
                  <button className="btn btn-xs btn-outline" onClick={() => { setConnectModal(p.key); setConnectForm({ handle: "", token: "" }); }}>Connect</button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">OAuth sign-in is coming per platform. For now you can connect a handle (and an API token if you have developer access). Publishing turns on as each platform's app is approved.</p>
      </div>

      {alert && <p className={`text-sm mb-3 ${alert.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{alert}</p>}

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔁</div>
          <p className="font-medium text-gray-600">No posts yet</p>
          <p className="text-sm mt-1">Hit <strong>+ New Post</strong> to create your first crosspost</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3 justify-between flex-wrap">
                <div className="flex gap-3 min-w-0">
                  {p.media?.[0] && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {p.kind === "image"
                        ? <img src={p.media[0].url} alt="" className="w-full h-full object-cover" />
                        : <video src={p.media[0].url} className="w-full h-full object-cover" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-xs badge-outline">{p.kind}</span>
                      <span className={`badge badge-xs ${resultBadge(p.status)}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{p.caption || <span className="text-gray-400">No caption</span>}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(p.platforms ?? []).map(pl => {
                        const res = p.results?.[pl];
                        return <span key={pl} className={`badge badge-xs ${res ? resultBadge(res.status) : "badge-ghost"}`}>{PLATFORM_LABEL[pl]}{res ? `: ${res.status}` : ""}</span>;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-xs btn-outline" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-xs btn-error" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect modal */}
      {connectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Connect {PLATFORM_LABEL[connectModal]}</h3>
              <p className="text-sm text-gray-500 mt-0.5">OAuth coming soon. Add your handle now; paste an API token if you have developer access.</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Handle / Username</label>
                <input className="input input-sm input-bordered w-full" placeholder="@yourhandle" value={connectForm.handle} onChange={e => setConnectForm(p => ({ ...p, handle: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Access token (optional)</label>
                <input className="input input-sm input-bordered w-full" placeholder="Only if you have API access" value={connectForm.token} onChange={e => setConnectForm(p => ({ ...p, token: e.target.value }))} />
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button className="btn btn-sm" onClick={() => setConnectModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitConnect}>Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
