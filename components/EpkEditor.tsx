"use client";
/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import ImagePicker from "@/components/ImagePicker";
import { EPK_LIMITS, withEpkDefaults, type Epk } from "@/libs/epk";
import { isEmbeddableVideo } from "@/libs/videoEmbed";

// EPK-only fields in the release page editor (create + edit). The page's
// name/image/description/video/links fields above it become the artist name,
// artist photo, tagline, featured video, and streaming links.

const label = "block font-bold mb-1";
const addBtn = "text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded border border-blue-400 hover:border-blue-600 transition-colors";

export default function EpkEditor({
  value,
  onChange,
  galleryImages,
  userId,
  font,
}: {
  value: Partial<Epk> | undefined;
  onChange: (epk: Epk) => void;
  galleryImages: string[];
  userId?: string;
  font?: string;
}) {
  const epk = withEpkDefaults(value);
  const set = (patch: Partial<Epk>) => onChange({ ...epk, ...patch });
  const [pickerOpen, setPickerOpen] = useState(false);

  const setAt = <K extends "highlights" | "videos" | "gallery">(key: K, i: number, v: string) =>
    set({ [key]: epk[key].map((x, idx) => (idx === i ? v : x)) } as Partial<Epk>);
  const removeAt = (key: keyof Epk, i: number) =>
    set({ [key]: (epk[key] as any[]).filter((_, idx) => idx !== i) } as Partial<Epk>);

  const addGalleryImage = (url: string) => {
    if (url && !epk.gallery.includes(url) && epk.gallery.length < EPK_LIMITS.gallery) set({ gallery: [...epk.gallery, url] });
  };

  return (
    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 space-y-6" style={{ fontFamily: font || "inherit" }}>
      <div>
        <h4 className="text-lg font-bold">Press Kit Details</h4>
        <p className="text-sm text-gray-500">Everything a booker, promoter, or journalist needs on one page.</p>
      </div>

      {/* Basics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Genre</label>
          <input className="input w-full" placeholder="e.g. Latin House, Alt R&B" value={epk.genre} onChange={(e) => set({ genre: e.target.value })} />
        </div>
        <div>
          <label className={label}>Based in</label>
          <input className="input w-full" placeholder="e.g. Miami, FL" value={epk.location} onChange={(e) => set({ location: e.target.value })} />
        </div>
        <div>
          <label className={label}>Booking email</label>
          <input className="input w-full" type="email" placeholder="booking@yourname.com" value={epk.bookingEmail} onChange={(e) => set({ bookingEmail: e.target.value })} />
        </div>
        <div>
          <label className={label}>Press kit / tech rider download</label>
          <input className="input w-full" placeholder="Link to a PDF, Google Drive, or Dropbox file" value={epk.pressKitUrl} onChange={(e) => set({ pressKitUrl: e.target.value })} />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className={label}>Bio</label>
        <textarea
          className="input w-full"
          style={{ minHeight: 160, paddingTop: 8, lineHeight: 1.5 }}
          placeholder="Tell your story: where you're from, your sound, notable releases, and what's next."
          maxLength={EPK_LIMITS.bio}
          value={epk.bio}
          onChange={(e) => set({ bio: e.target.value })}
        />
        <p className="text-xs text-gray-400 text-right">{epk.bio.length} / {EPK_LIMITS.bio}</p>
      </div>

      {/* Highlights */}
      <div>
        <label className={label}>Highlights</label>
        <p className="text-xs text-gray-500 mb-2">Streams, playlists, press, awards, support slots — one per line.</p>
        <div className="space-y-2">
          {epk.highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-full" placeholder="e.g. 1M+ streams on Spotify" value={h} onChange={(e) => setAt("highlights", i, e.target.value)} />
              <button type="button" className="btn btn-sm btn-alert" onClick={() => removeAt("highlights", i)} aria-label="Remove highlight"><FontAwesomeIcon icon={faTrash} /></button>
            </div>
          ))}
        </div>
        {epk.highlights.length < EPK_LIMITS.highlights && (
          <button type="button" className={`${addBtn} mt-2`} onClick={() => set({ highlights: [...epk.highlights, ""] })}>+ Add highlight</button>
        )}
      </div>

      {/* Videos */}
      <div>
        <label className={label}>More videos & playlists</label>
        <p className="text-xs text-gray-500 mb-2">YouTube or Vimeo links to live sets, music videos, or interviews. Playlist links embed the whole playlist. Your featured video above shows first.</p>
        <div className="space-y-2">
          {epk.videos.map((v, i) => (
            <div key={i}>
              <div className="flex gap-2">
                <input className="input w-full" placeholder="YouTube or Vimeo video / playlist link" value={v} onChange={(e) => setAt("videos", i, e.target.value)} />
                <button type="button" className="btn btn-sm btn-alert" onClick={() => removeAt("videos", i)} aria-label="Remove video"><FontAwesomeIcon icon={faTrash} /></button>
              </div>
              {v.trim() && !isEmbeddableVideo(v) && <p className="text-xs text-red-500 mt-1">That doesn't look like a YouTube or Vimeo link — it won't be shown.</p>}
            </div>
          ))}
        </div>
        {epk.videos.length < EPK_LIMITS.videos && (
          <button type="button" className={`${addBtn} mt-2`} onClick={() => set({ videos: [...epk.videos, ""] })}>+ Add video</button>
        )}
      </div>

      {/* Venues */}
      <div>
        <label className={label}>Venues & shows</label>
        <p className="text-xs text-gray-500 mb-2">Venues, festivals, and events you've played.</p>
        <div className="space-y-2">
          {epk.venues.map((v, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] gap-1.5 sm:gap-2 items-center">
              <input className="input input-sm sm:input-md w-full min-w-0 px-2 sm:px-4 text-sm" placeholder="Venue" aria-label="Venue or festival" value={v.name} onChange={(e) => set({ venues: epk.venues.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
              <input className="input input-sm sm:input-md w-full min-w-0 px-2 sm:px-4 text-sm" placeholder="City" aria-label="City" value={v.city} onChange={(e) => set({ venues: epk.venues.map((x, idx) => (idx === i ? { ...x, city: e.target.value } : x)) })} />
              <input className="input input-sm sm:input-md w-full min-w-0 px-2 sm:px-4 text-sm" placeholder="Year" aria-label="Year or date" value={v.date} onChange={(e) => set({ venues: epk.venues.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)) })} />
              <button type="button" className="btn btn-xs sm:btn-sm btn-alert" onClick={() => removeAt("venues", i)} aria-label="Remove venue"><FontAwesomeIcon icon={faTrash} /></button>
            </div>
          ))}
        </div>
        {epk.venues.length < EPK_LIMITS.venues && (
          <button type="button" className={`${addBtn} mt-2`} onClick={() => set({ venues: [...epk.venues, { name: "", city: "", date: "" }] })}>+ Add venue</button>
        )}
      </div>

      {/* Gallery */}
      <div>
        <label className={label}>Photo gallery</label>
        <p className="text-xs text-gray-500 mb-2">Press photos and live shots — up to {EPK_LIMITS.gallery}.</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {epk.gallery.map((src, i) => (
            <div key={src} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Gallery photo ${i + 1}`} className="w-full aspect-square object-cover rounded-md" />
              <button
                type="button"
                onClick={() => removeAt("gallery", i)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 w-7 h-7 rounded-md text-white text-xs"
                style={{ background: "rgba(220,38,38,0.85)" }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
          {epk.gallery.length < EPK_LIMITS.gallery && (
            <button type="button" onClick={() => setPickerOpen(true)} className="aspect-square rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex flex-col items-center justify-center text-xs gap-1">
              <FontAwesomeIcon icon={faPlus} />
              Add photo
            </button>
          )}
        </div>
      </div>

      {/* Press quotes */}
      <div>
        <label className={label}>Press quotes</label>
        <p className="text-xs text-gray-500 mb-2">What blogs, DJs, or other artists have said about you.</p>
        <div className="space-y-3">
          {epk.pressQuotes.map((q, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-md space-y-2">
              <textarea className="input w-full" style={{ minHeight: 70, paddingTop: 8 }} placeholder="The quote" value={q.quote} onChange={(e) => set({ pressQuotes: epk.pressQuotes.map((x, idx) => (idx === i ? { ...x, quote: e.target.value } : x)) })} />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input className="input w-full" placeholder="Source (e.g. Lyrical Lemonade)" value={q.source} onChange={(e) => set({ pressQuotes: epk.pressQuotes.map((x, idx) => (idx === i ? { ...x, source: e.target.value } : x)) })} />
                <input className="input w-full" placeholder="Link to article (optional)" value={q.url} onChange={(e) => set({ pressQuotes: epk.pressQuotes.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)) })} />
                <button type="button" className="btn btn-sm btn-alert" onClick={() => removeAt("pressQuotes", i)} aria-label="Remove quote"><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            </div>
          ))}
        </div>
        {epk.pressQuotes.length < EPK_LIMITS.pressQuotes && (
          <button type="button" className={`${addBtn} mt-2`} onClick={() => set({ pressQuotes: [...epk.pressQuotes, { quote: "", source: "", url: "" }] })}>+ Add quote</button>
        )}
      </div>

      {pickerOpen && (
        <ImagePicker
          title="Add a gallery photo"
          images={galleryImages}
          uploadPreset="ReleasePageImages"
          uploadOptions={{ publicId: `user_${userId}_epkGallery_${Date.now()}` }}
          onUploaded={(result: any) => addGalleryImage(result?.info?.secure_url || "")}
          onSelect={(url: string) => addGalleryImage(url)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
