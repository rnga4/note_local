"use client";
import { useEffect, useState } from "react";
import { noteClass } from "@/lib/colors";
import { type NoteInput, COLORS } from "@/lib/types";
import { toItems, toText } from "@/lib/util";
import { ChecklistEditor } from "./ChecklistEditor";
import { ColorPicker } from "./ColorPicker";
import { PinIcon } from "./icons";

const EMPTY: NoteInput = { title: "", content: "", type: "text", items: [], color: "default", pinned: false, archived: false, labels: [] };
const DRAFT_KEY = "note-composer-draft";

function readDraft(): NoteInput | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<NoteInput>;
    if (typeof d !== "object" || !Array.isArray(d.items)) return null;
    if (d.type && !["text", "list"].includes(d.type)) return null;
    if (d.color && !COLORS.includes(d.color)) return null;
    return { ...EMPTY, ...d };
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage can be blocked; the in-memory draft still works */
  }
}

const iconBtn =
  "grid h-11 w-11 place-items-center rounded text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]";
const textBtn =
  "min-h-11 rounded px-3 text-sm text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]";

export function Composer({ onCreate }: { onCreate: (n: NoteInput) => void }) {
  const [draft, setDraft] = useState<NoteInput>(EMPTY);
  const [open, setOpen] = useState(false);
  const patch = (p: Partial<NoteInput>) => setDraft((d) => ({ ...d, ...p }));

  const hasContent = Boolean(draft.title.trim() || draft.content.trim() || draft.items.length);

  useEffect(() => {
    const d = readDraft();
    if (!d) return;
    setDraft(d);
    setOpen(Boolean(d.title.trim() || d.content.trim() || d.items.length));
  }, []);

  useEffect(() => {
    if (!hasContent) {
      clearDraft();
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage can be blocked; the in-memory draft still works */
    }
  }, [draft]);

  const cancel = () => {
    clearDraft();
    setDraft(EMPTY);
    setOpen(false);
  };

  const save = () => {
    if (hasContent) onCreate(draft);
    clearDraft();
    setDraft(EMPTY);
    setOpen(false);
  };

  const toggleType = () =>
    draft.type === "text"
      ? patch({ type: "list", items: toItems(draft.content), content: "" })
      : patch({ type: "text", content: toText(draft.items), items: [] });

  if (!open) {
    return (
      <div className="mb-6 flex max-w-xl items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 mx-auto">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 flex-1 rounded px-2 text-left text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          Take a note...
        </button>
        <button
          type="button"
          onClick={() => {
            patch({ type: "list" });
            setOpen(true);
          }}
          className="min-h-11 rounded px-3 text-sm text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          New list
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-auto mb-6 max-w-xl rounded-lg border p-3 ${noteClass(draft.color)}`}>
      <input
        autoFocus
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="Title"
        aria-label="Title"
        className="mb-1 min-h-11 w-full bg-transparent font-medium placeholder:text-[var(--muted)]"
      />
      {draft.type === "text" ? (
        <textarea
          value={draft.content}
          onChange={(e) => patch({ content: e.target.value })}
          placeholder="Take a note..."
          aria-label="Note text"
          rows={4}
          className="w-full resize-none bg-transparent text-sm placeholder:text-[var(--muted)]"
        />
      ) : (
        <ChecklistEditor items={draft.items} onChange={(items) => patch({ items })} />
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <ColorPicker value={draft.color} onChange={(color) => patch({ color })} />
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            aria-label="Pin note"
            aria-pressed={draft.pinned}
            title={draft.pinned ? "Unpin" : "Pin"}
            onClick={() => patch({ pinned: !draft.pinned })}
            className={`${iconBtn} ${draft.pinned ? "text-[var(--text)]" : ""}`}
          >
            <PinIcon filled={draft.pinned} />
          </button>
          <button type="button" onClick={toggleType} className={textBtn}>
            {draft.type === "text" ? "Make list" : "Make text"}
          </button>
          <button type="button" onClick={cancel} className={textBtn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!hasContent}
            className="min-h-11 rounded bg-[var(--text)] px-4 text-sm font-medium text-[var(--bg)] transition disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
