"use client";
import { useEffect, useRef, useState } from "react";
import { noteClass } from "@/lib/colors";
import type { Note, NotePatch } from "@/lib/types";
import { ChecklistEditor } from "./ChecklistEditor";
import { ColorPicker } from "./ColorPicker";
import { CloseIcon } from "./icons";

type Props = { note: Note; onSave: (id: string, p: NotePatch) => void; onClose: () => void };

export function NoteEditor({ note, onSave, onClose }: Props) {
  const [d, setD] = useState<Note>(note);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<() => void>(() => {});
  const patch = (p: Partial<Note>) => setD((x) => ({ ...x, ...p }));

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 160);
  };

  const save = () => {
    onSave(note.id, {
      title: d.title,
      content: d.content,
      items: d.items,
      color: d.color,
      labels: d.labels,
      pinned: d.pinned,
    });
    close();
  };

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const focusables = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>("button, input, textarea, [tabindex]:not([tabindex='-1'])"),
      ).filter((x) => !x.hasAttribute("disabled"));

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        saveRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      const first = f[0];
      const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`${closing ? "exit-fade" : "enter-fade"} fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--scrim)] p-4`}
      onClick={close}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit note"
        onClick={(e) => e.stopPropagation()}
        className={`nb ${closing ? "exit-sheet" : "enter-sheet"} my-auto w-full max-w-xl p-4 ${noteClass(d.color)} max-h-[calc(100dvh-2rem)] overflow-y-auto`}
      >
        <input
          value={d.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Title"
          aria-label="Title"
          className="mb-1 min-h-11 w-full bg-transparent text-lg font-bold placeholder:text-[var(--muted)]"
        />
        {d.type === "text" ? (
          <textarea
            value={d.content}
            onChange={(e) => patch({ content: e.target.value })}
            aria-label="Note text"
            rows={10}
            className="w-full resize-none bg-transparent text-sm"
          />
        ) : (
          <ChecklistEditor items={d.items} onChange={(items) => patch({ items })} />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1">
          {d.labels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => patch({ labels: d.labels.filter((x) => x !== l) })}
              aria-label={`Remove label ${l}`}
              className="flex min-h-11 items-center gap-1 border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium hover:bg-[var(--hover)]"
            >
              {l}
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          ))}
          <input
            placeholder="+ label"
            aria-label="Add label"
            onKeyDown={(e) => {
              const v = e.currentTarget.value.trim();
              if (e.key === "Enter" && v && !d.labels.includes(v)) {
                patch({ labels: [...d.labels, v] });
                e.currentTarget.value = "";
              }
            }}
            className="min-h-11 w-32 bg-transparent px-2 text-sm placeholder:text-[var(--muted)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <ColorPicker value={d.color} onChange={(color) => patch({ color })} />
          <button
            type="button"
            onClick={save}
            className="nb-btn min-h-11 bg-[var(--accent)] px-4 text-sm font-bold text-[var(--accent-ink)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
