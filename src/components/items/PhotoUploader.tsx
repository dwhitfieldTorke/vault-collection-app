"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadItemPhoto, deleteItemPhoto } from "@/lib/photos";

interface PhotoUploaderProps {
  ownerId: string;
  itemId: string;
  photoUrl?: string;
  onChange: (url: string | undefined) => void;
}

export default function PhotoUploader({ ownerId, itemId, photoUrl, onChange }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const previous = photoUrl;
    try {
      const url = await uploadItemPhoto(ownerId, itemId, file);
      onChange(url);
      if (previous) await deleteItemPhoto(previous);
    } catch {
      setError("Failed to upload photo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!photoUrl) return;
    const previous = photoUrl;
    onChange(undefined);
    await deleteItemPhoto(previous);
  }

  return (
    <div>
      {photoUrl ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
          <Image src={photoUrl} alt="Cover photo" fill sizes="128px" className="object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/70 text-white text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-32 h-32 rounded-lg border border-dashed border-border hover:border-accent text-ink-faint hover:text-accent text-xs flex items-center justify-center transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "+ Add cover"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
