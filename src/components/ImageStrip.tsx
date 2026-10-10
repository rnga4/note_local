"use client";
import { useState } from "react";
import { CloseIcon } from "./icons";
import { Lightbox } from "./Lightbox";

export function ImageStrip({ images, onRemove }: { images: string[]; onRemove: (index: number) => void }) {
  const [view, setView] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((src, i) => (
        <div key={i} className="relative">
          <button
            type="button"
            aria-label={`Open image ${i + 1}`}
            onClick={() => setView(i)}
            className="block border-2 border-[var(--border)]"
          >
            <img src={src} alt="" className="h-20 w-20 object-cover" />
          </button>
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onRemove(i)}
            className="nb-btn absolute -right-2 -top-2 grid h-7 w-7 place-items-center bg-[var(--surface)] text-[var(--text)]"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {view !== null && <Lightbox images={images} start={view} onClose={() => setView(null)} label="Image preview" />}
    </div>
  );
}
