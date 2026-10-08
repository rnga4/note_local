"use client";
import { useEffect, useState } from "react";
import type { View } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  view: View;
  label: string;
  labels: string[];
  trashCount: number;
  onView: (v: View) => void;
  onLabel: (l: string) => void;
  onEmptyTrash: () => void;
  className?: string;
};

const item = (active: boolean) =>
  `flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-sm transition ${
    active
      ? "bg-[var(--surface-2)] font-semibold text-[var(--text)]"
      : "font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
  }`;

export function NavList({ view, label, labels, trashCount, onView, onLabel, onEmptyTrash, className = "" }: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <nav className={`flex flex-col gap-0.5 ${className}`}>
      <button type="button" className={item(view === "notes" && !label)} onClick={() => onView("notes")}>
        Notes
      </button>
      {labels.map((l) => (
        <button key={l} type="button" className={item(view === "notes" && label === l)} onClick={() => onLabel(l)}>
          {l}
        </button>
      ))}
      <button type="button" className={item(view === "archive")} onClick={() => onView("archive")}>
        Archive
      </button>
      <button type="button" className={item(view === "trash")} onClick={() => onView("trash")}>
        {trashCount > 0 ? `Trash (${trashCount})` : "Trash"}
      </button>
      {view === "trash" && trashCount > 0 && (
        <button
          type="button"
          onClick={() => {
            if (confirming) {
              onEmptyTrash();
              setConfirming(false);
            } else {
              setConfirming(true);
            }
          }}
          className={`mt-2 min-h-11 px-3 text-left text-sm underline underline-offset-4 transition ${
            confirming ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          {confirming ? "Confirm empty trash?" : `Empty trash (${trashCount})`}
        </button>
      )}
      <ThemeToggle className="mt-3" />
      <a
        href="/api/export"
        download
        className="mt-1 flex min-h-11 items-center rounded px-3 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
      >
        Download backup
      </a>
    </nav>
  );
}

export function Sidebar(props: Props) {
  return (
    <aside className="hidden w-56 shrink-0 py-3 md:block">
      <NavList {...props} />
    </aside>
  );
}
