"use client";
import { CloseIcon } from "./icons";

export function ImageStrip({ images, onRemove }: { images: string[]; onRemove: (index: number) => void }) {
  if (!images.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((src, i) => (
        <div key={i} className="relative">
          <img
            src={src}
            alt=""
            className="h-20 w-20 border-2 border-[var(--border)] object-cover"
          />
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
    </div>
  );
}
