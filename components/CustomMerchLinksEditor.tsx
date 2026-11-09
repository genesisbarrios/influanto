"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faImage, faSpinner, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";
import ImagePicker from "@/components/ImagePicker";

export interface CustomMerchLink {
  name: string;
  url: string;
  image?: string;
  // "auto" = pulled from the product page (refreshed when the URL changes);
  // "custom" = uploaded/picked by the user (never overwritten automatically).
  imageSource?: "auto" | "custom";
}

interface Props {
  links: CustomMerchLink[];
  onChange: (links: CustomMerchLink[]) => void;
  galleryImages: string[];
  uploadPreset: string;
  uploadOptions: (index: number) => Record<string, any>;
  onGalleryChange?: () => void; // e.g. reload the gallery after an upload
  font?: string;
}

const looksLikeUrl = (v: string) => /^(https?:\/\/)?[^\s/]+\.[^\s/]{2,}(\/\S*)?$/i.test(v.trim());

// Clean a page title into a short merch name ("Tour Tee – Artist Store" -> "Tour Tee").
function nameFromTitle(title: string) {
  const first = title.split(/\s[|–—-]\s/)[0] || title;
  return first.replace(/https?:\/\/\S+/g, "").replace(/@/g, "").trim().slice(0, 50);
}

export default function CustomMerchLinksEditor({ links, onChange, galleryImages, uploadPreset, uploadOptions, onGalleryChange, font }: Props) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<Record<number, { loading?: boolean; error?: string }>>({});
  const lastFetched = useRef<Record<number, string>>({});
  // Always read the latest links inside async callbacks.
  const linksRef = useRef(links);
  linksRef.current = links;

  const update = (index: number, patch: Partial<CustomMerchLink>) => {
    const next = [...linksRef.current];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const fetchImage = async (index: number, force = false) => {
    const link = linksRef.current[index];
    const url = (link?.url || "").trim();
    if (!url || !looksLikeUrl(url)) return;
    if (!force && (link.imageSource === "custom" || lastFetched.current[index] === url)) return;
    lastFetched.current[index] = url;
    setStatus((s) => ({ ...s, [index]: { loading: true } }));
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      const current = linksRef.current[index];
      // Ignore if the row changed while we were fetching.
      if (!current || current.url.trim() !== url) return;
      if (data.image) {
        const patch: Partial<CustomMerchLink> = { image: data.image, imageSource: "auto" };
        if (!current.name?.trim() && data.title) patch.name = nameFromTitle(data.title);
        update(index, patch);
        setStatus((s) => ({ ...s, [index]: {} }));
      } else {
        setStatus((s) => ({ ...s, [index]: { error: data.error ? `No image found (${data.error.toLowerCase()})` : "No image found on that page. Upload one instead." } }));
      }
    } catch {
      setStatus((s) => ({ ...s, [index]: { error: "Couldn't load a preview. Upload an image instead." } }));
    }
  };

  const add = () => onChange([...links, { name: "", url: "" }]);
  const remove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
    // Row indexes shift after a delete; reset per-row caches.
    lastFetched.current = {};
    setStatus({});
  };

  return (
    <div className="mt-4 border-t border-purple-200 pt-4">
      <p className="text-purple-600 text-sm mb-2" style={{ fontFamily: font || "inherit" }}>
        Add links to your own merch — a store, an Etsy shop, anything not on Printify. The product image is pulled from the link automatically, or tap the image to upload your own.
      </p>

      {links.map((link, index) => {
        const st = status[index] || {};
        return (
          <div key={index} className="mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setPickerIndex(index)}
                  title={link.image ? "Change image" : "Add image"}
                  className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
                >
                  {st.loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : link.image ? (
                    <img
                      src={link.image}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => setStatus((s) => ({ ...s, [index]: { error: "That image couldn't be loaded. Upload one instead." } }))}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faImage} />
                  )}
                </button>
                {link.image && !st.loading && (
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() => { update(index, { image: "", imageSource: "custom" }); setStatus((s) => ({ ...s, [index]: {} })); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-[10px] flex items-center justify-center hover:bg-red-600"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
              <input
                type="text"
                className="input input-sm flex-1 min-w-[120px]"
                placeholder="Name (e.g. T-Shirt)"
                value={link.name || ""}
                onChange={(e) => update(index, { name: e.target.value })}
                style={{ fontFamily: font || "inherit" }}
              />
              <input
                type="text"
                className="input input-sm flex-1 min-w-[160px]"
                placeholder="https://your-store.com/product"
                value={link.url || ""}
                onChange={(e) => update(index, { url: e.target.value })}
                onBlur={() => fetchImage(index)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (looksLikeUrl(pasted)) setTimeout(() => fetchImage(index), 0);
                }}
                style={{ fontFamily: font || "inherit" }}
              />
              <button type="button" className="btn btn-sm btn-alert" onClick={() => remove(index)} title="Remove merch link">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            {(st.error || (link.url && looksLikeUrl(link.url) && !st.loading)) && (
              <div className="flex items-center gap-3 mt-1 ml-14 text-[11px]">
                {st.error && <span className="text-amber-600">{st.error}</span>}
                {link.url && looksLikeUrl(link.url) && !st.loading && (
                  <button type="button" className="text-purple-600 hover:text-purple-800" onClick={() => fetchImage(index, true)}>
                    <FontAwesomeIcon icon={faRotate} className="mr-1" />
                    {link.image ? "Re-fetch image from link" : "Fetch image from link"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-0.5 rounded border border-purple-400 hover:border-purple-600 transition-colors"
        onClick={add}
        style={{ fontFamily: font || "inherit" }}
      >
        + Add merch link
      </button>

      {pickerIndex !== null && (
        <ImagePicker
          images={galleryImages}
          uploadPreset={uploadPreset}
          uploadOptions={uploadOptions(pickerIndex)}
          title="Choose a merch image"
          onUploaded={(result: any) => {
            const url = result?.info?.secure_url;
            if (url) update(pickerIndex, { image: url, imageSource: "custom" });
            setStatus((s) => ({ ...s, [pickerIndex]: {} }));
            onGalleryChange?.();
          }}
          onSelect={(url: string) => {
            update(pickerIndex, { image: url, imageSource: "custom" });
            setStatus((s) => ({ ...s, [pickerIndex]: {} }));
          }}
          onClose={() => setPickerIndex(null)}
        />
      )}
    </div>
  );
}
