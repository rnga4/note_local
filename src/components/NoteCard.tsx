"use client";
import { useState, type CSSProperties } from "react";
import { noteClass } from "@/lib/colors";
import type { Note, NotePatch, View } from "@/lib/types";
import { ArchiveIcon, EditIcon, PinIcon, RestoreIcon, TrashIcon } from "./icons";

type Props = {
  note: Note;
  view: View;
  index?: number;
  onOpen: (n: Note) => void;
  onPatch: (id: string, p: NotePatch) => void;
  onDelete: (id: string) => void;
};

const btn =
  "grid h-11 w-11 place-items-center text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]";

export function NoteCard({ note, view, index = 0, onOpen, onPatch, onDelete }: Props) {
  const [leaving, setLeaving] = useState(false);

  const leave = (fn: () => void) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(fn, 170);
  };

  const toggle = (itemId: string) =>
    onPatch(note.id, { items: note.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) });

  const showUntitled = !note.title && !(note.type === "text" && note.content);

  return (
    <article
      className={`nb nb-card group relative mb-3 break-inside-avoid p-3 ${noteClass(note.color)} ${leaving ? "leaving" : ""}`}
      style={leaving ? undefined : ({ "--enter-delay": `${Math.min(index, 12) * 35}ms` } as CSSProperties)}
    >
      {note.pinned && view === "notes" && (
        <span className="absolute right-2 top-2 border-2 border-[var(--border)] bg-[var(--text)] px-1.5 py-0.5 text-xs font-bold text-[var(--bg)]">
          Pinned
        </span>
      )}

      <button
        type="button"
        onClick={() => onOpen(note)}
        className={`block min-h-11 w-full px-1 py-1.5 text-left ${note.pinned && view === "notes" ? "pr-20" : ""}`}
      >
        {note.title && <span className="mb-1 block font-bold">{note.title}</span>}
        {showUntitled && <span className="mb-1 block text-sm font-medium text-[var(--muted)]">Untitled</span>}
        {note.type === "text" && note.content && (
          <span className="line-clamp-12 whitespace-pre-wrap text-sm">{note.content}</span>
        )}
      </button>

      {note.type === "list" && (
        <ul className="mt-1 space-y-0.5">
          {note.items.slice(0, 10).map((i) => (
            <li key={i.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={i.done}
                  onChange={() => toggle(i.id)}
                  className="h-4 w-4 shrink-0"
                />
                <span className={i.done ? "text-[var(--muted)] line-through" : ""}>{i.text}</span>
              </label>
            </li>
          ))}
          {note.items.length > 10 && (
            <li className="pl-6 text-xs text-[var(--muted)]">+{note.items.length - 10} more</li>
          )}
        </ul>
      )}

      {note.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.labels.map((l) => (
            <span
              key={l}
              className="border-2 border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-medium"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-1 md:opacity-0 md:transition md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        {view === "trash" ? (
          <>
            <button
              type="button"
              className={btn}
              title="Restore"
              aria-label="Restore note"
              onClick={() => leave(() => onPatch(note.id, { trashed: false }))}
            >
              <RestoreIcon />
            </button>
            <button
              type="button"
              className={btn}
              title="Delete forever"
              aria-label="Delete note forever"
              onClick={() => leave(() => onDelete(note.id))}
            >
              <TrashIcon />
            </button>
          </>
        ) : (
          <>
            <button type="button" className={btn} title="Edit" aria-label="Edit note" onClick={() => onOpen(note)}>
              <EditIcon />
            </button>
            <button
              type="button"
              className={`${btn} ${note.pinned ? "text-[var(--text)]" : ""}`}
              title={note.pinned ? "Unpin" : "Pin"}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              aria-pressed={note.pinned}
              onClick={() => onPatch(note.id, { pinned: !note.pinned })}
            >
              <PinIcon filled={note.pinned} />
            </button>
            <button
              type="button"
              className={btn}
              title={note.archived ? "Unarchive" : "Archive"}
              aria-label={note.archived ? "Unarchive note" : "Archive note"}
              aria-pressed={note.archived}
              onClick={() => leave(() => onPatch(note.id, { archived: !note.archived }))}
            >
              <ArchiveIcon />
            </button>
            <button
              type="button"
              className={btn}
              title="Move to trash"
              aria-label="Move note to trash"
              onClick={() => leave(() => onPatch(note.id, { trashed: true }))}
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
