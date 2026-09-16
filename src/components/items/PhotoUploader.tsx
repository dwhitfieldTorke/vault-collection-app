"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadItemPhoto, deleteItemPhoto } from "@/lib/photos";

interface PhotoUploaderProps {
  ownerId: string;
  itemId: string;
  photoUrls: string[];
  onChange: (urls: string[]) => void;
}

export default function PhotoUploader({ ownerId, itemId, photoUrls, onChange }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map((file) => uploadItemPhoto(ownerId, itemId, file))
      );
      onChange([...photoUrls, ...uploads]);
    } catch {
      setError("Failed to upload one or more photos.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(url: string) {
    onChange(photoUrls.filter((u) => u !== url));
    await deleteItemPhoto(url);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {photoUrls.map((url) => (
          <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700">
            <Image src={url} alt="Item photo" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 w-5 h-5 rounded bg-gray-950/80 text-gray-300 hover:text-white text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-lg border border-dashed border-gray-700 hover:border-amber-500/60 text-gray-500 hover:text-amber-400 text-xs flex items-center justify-center transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "+ Add photo"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
