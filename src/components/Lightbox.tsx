"use client";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronRightIcon, CloseIcon } from "./icons";

type Props = {
  images: string[];
  start?: number;
  label?: string;
  onClose: () => void;
};

const ctrl = "nb-btn grid h-11 w-11 place-items-center text-[var(--text)]";

export function Lightbox({ images, start = 0, label = "Image", onClose }: Props) {
  const n = images.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(start, 0), Math.max(n - 1, 0)));
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const go = (d: number) => setIndex((i) => (i + d + n) % n);

  useLayoutEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "ArrowRight" && n > 1) {
      e.preventDefault();
      e.stopPropagation();
      go(1);
      return;
    }
    if (e.key === "ArrowLeft" && n > 1) {
      e.preventDefault();
      e.stopPropagation();
      go(-1);
      return;
    }
    if (e.key === "Tab") {
      e.stopPropagation();
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-lightbox=""
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="enter-fade fixed inset-0 z-[60] flex items-center justify-center bg-[var(--scrim)] p-4"
    >
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close image" className={`${ctrl} absolute right-3 top-3`}>
        <CloseIcon />
      </button>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className={`${ctrl} absolute left-3 top-1/2 -translate-y-1/2`}
          >
            <ChevronRightIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className={`${ctrl} absolute right-3 top-1/2 -translate-y-1/2`}
          >
            <ChevronRightIcon />
          </button>
          <span
            aria-live="polite"
            className="nb absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-bold text-[var(--text)]"
          >
            {index + 1} / {n}
          </span>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`Image ${index + 1} of ${n}`}
        onClick={onClose}
        className="nb max-h-[85vh] max-w-[90vw] object-contain"
      />
    </div>,
    document.body,
  );
}
