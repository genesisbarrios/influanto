"use client";
/* eslint-disable */
import React from "react";
import { CldUploadWidget } from "next-cloudinary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

interface Props {
  images: string[];                 // the user's existing images (gallery)
  uploadPreset: string;
  uploadOptions?: Record<string, any>;
  onUploaded: (result: any) => void; // cloudinary upload result
  onSelect: (url: string) => void;   // picked an existing image
  onClose: () => void;
  title?: string;
}

export default function ImagePicker({ images, uploadPreset, uploadOptions, onUploaded, onSelect, onClose, title = "Choose an image" }: Props) {
  const gallery = Array.from(new Set((images || []).filter(Boolean)));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col text-black">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none"><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          <CldUploadWidget
            uploadPreset={uploadPreset}
            options={uploadOptions}
            onSuccess={(result: any) => { onUploaded(result); onClose(); }}
          >
            {({ open }: { open: () => void }) => (
              <button type="button" onClick={() => open()} className="btn btn-primary w-full mb-4">
                <FontAwesomeIcon icon={faArrowUpFromBracket} className="mr-1.5" /> Upload a new image
              </button>
            )}
          </CldUploadWidget>

          {gallery.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-2">Or select from your images</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => { onSelect(url); onClose(); }}
                    className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">No saved images yet — upload your first one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
