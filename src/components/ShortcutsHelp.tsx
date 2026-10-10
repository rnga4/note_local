"use client";
import { useEffect, useState } from "react";

const ROWS: [string, string][] = [
  ["/", "Focus search"],
  ["c", "New note"],
  ["g then n", "Go to notes"],
  ["g then a", "Go to archive"],
  ["g then t", "Go to trash"],
  ["e", "Edit focused note"],
  ["Delete", "Trash focused note"],
  ["x", "Toggle selection"],
  ["?", "Show this help"],
  ["Esc", "Close, clear search, or exit selection"],
];

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 160);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${closing ? "exit-fade" : "enter-fade"} fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--scrim)] p-4`}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className={`nb ${closing ? "exit-sheet" : "enter-sheet"} my-auto w-full max-w-md p-4`}
      >
        <h2 className="mb-3 text-lg font-black">Keyboard shortcuts</h2>
        <dl className="space-y-2 text-sm">
          {ROWS.map(([k, desc]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <dt>
                <kbd className="border-2 border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-bold">{k}</kbd>
              </dt>
              <dd className="text-right text-[var(--muted)]">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
