"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Note, NoteInput, NotePatch, View } from "@/lib/types";
import { Composer } from "./Composer";
import { MenuIcon } from "./icons";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import { NavList, Sidebar } from "./Sidebar";

type Status = "loading" | "ready" | "error";

const linkBtn =
  "min-h-11 rounded px-2 text-sm text-[var(--text)] underline underline-offset-4 hover:bg-[var(--hover)]";

export function NotesApp() {
  const [view, setView] = useState<View>("notes");
  const [q, setQ] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const [editing, setEditing] = useState<Note | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const notesRef = useRef(notes);
  const openerRef = useRef<HTMLElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const refresh = useCallback(async () => {
    try {
      const [n, r] = await Promise.all([api.list(view, q, label), api.labels()]);
      setNotes(n);
      setLabels(r.labels);
      setTrashCount(r.trashedCount);
      setLoadedScope(`${view}\u0000${label}`);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, [view, q, label]);

  useEffect(() => {
    setStatus((s) => (s === "error" ? s : "loading"));
    const t = setTimeout(() => void refresh(), 200);
    return () => clearTimeout(t);
  }, [refresh]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const create = (n: NoteInput) => run(() => api.create(n));
  const patch = async (id: string, p: NotePatch) => {
    const prev = notesRef.current;
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...p } : n)));
    try {
      await api.patch(id, p);
      await refresh();
    } catch (e) {
      console.error(e);
      setNotes(prev);
      setStatus("error");
    }
  };
  const remove = (id: string) => run(() => api.remove(id));
  const emptyTrash = () => run(() => api.emptyTrash());

  const openEditor = (n: Note) => {
    if (view === "trash") return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditing(n);
  };
  const closeEditor = () => {
    setEditing(null);
    const el = openerRef.current;
    openerRef.current = null;
    requestAnimationFrame(() => el?.focus());
  };

  const goView = (v: View) => {
    setView(v);
    setLabel("");
    setNavOpen(false);
    requestAnimationFrame(() => menuBtnRef.current?.focus());
  };
  const goLabel = (l: string) => {
    setView("notes");
    setLabel(l);
    setNavOpen(false);
    requestAnimationFrame(() => menuBtnRef.current?.focus());
  };
  const toggleNav = () => {
    const next = !navOpen;
    setNavOpen(next);
    if (!next) requestAnimationFrame(() => menuBtnRef.current?.focus());
  };

  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);
  const showSections = view === "notes" && pinned.length > 0 && others.length > 0;

  const grid = (list: Note[]) => (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
      {list.map((n) => (
        <NoteCard
          key={n.id}
          note={n}
          view={view}
          onOpen={openEditor}
          onPatch={patch}
          onDelete={remove}
        />
      ))}
    </div>
  );

  const navProps = {
    view,
    label,
    labels,
    trashCount,
    onView: goView,
    onLabel: goLabel,
    onEmptyTrash: emptyTrash,
  };

  const scopeReady = loadedScope === `${view}\u0000${label}`;

  let body;
  if (status === "error") {
    body = (
      <div role="alert" className="mx-auto mt-16 max-w-xl text-center">
        <p className="mb-3 text-sm">Something went wrong. Check that the server is running.</p>
        <button type="button" onClick={() => void refresh()} className={linkBtn}>
          Try again
        </button>
      </div>
    );
  } else if (!scopeReady || (status === "loading" && notes.length === 0)) {
    body = (
      <p role="status" className="mt-16 text-center text-sm text-[var(--muted)]">
        Loading notes...
      </p>
    );
  } else if (notes.length === 0) {
    body = (
      <div className="mt-16 text-center">
        <p className="text-sm text-[var(--muted)]">
          {view === "trash"
            ? "Trash is empty."
            : view === "archive"
              ? "Archive is empty."
              : label
                ? `No notes labeled "${label}".`
                : q
                  ? `No notes match "${q}".`
                  : "No notes yet. Write one in the box above."}
        </p>
        {(label || q) && view === "notes" && (
          <button
            type="button"
            onClick={() => {
              setLabel("");
              setQ("");
            }}
            className={`${linkBtn} mt-2`}
          >
            Clear filter
          </button>
        )}
      </div>
    );
  } else {
    body = (
      <>
        {showSections && (
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">Pinned</h2>
        )}
        {pinned.length > 0 && grid(pinned)}
        {showSections && others.length > 0 && (
          <h2 className="mb-2 mt-6 text-sm font-medium text-[var(--muted)]">Others</h2>
        )}
        {others.length > 0 && grid(others)}
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 px-2 py-1.5 md:gap-4 md:px-4 md:py-2">
          <button
            ref={menuBtnRef}
            type="button"
            onClick={toggleNav}
            aria-label={navOpen ? "Hide menu" : "Show menu"}
            aria-expanded={navOpen}
            aria-controls="nav-panel"
            className="grid h-11 w-11 shrink-0 place-items-center rounded text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] md:hidden"
          >
            <MenuIcon />
          </button>
          <h1 className="shrink-0 text-lg font-semibold">Notes</h1>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm placeholder:text-[var(--muted)] md:max-w-xl"
          />
        </div>
        <div id="nav-panel" hidden={!navOpen} className="enter-drop border-t border-[var(--border)] px-2 py-2 md:hidden">
          <NavList {...navProps} />
        </div>
      </header>

      <div className="flex">
        <Sidebar {...navProps} />
        <main className="min-w-0 flex-1 p-4">
          {view === "notes" && <Composer onCreate={create} />}
          {body}
        </main>
      </div>

      {editing && <NoteEditor key={editing.id} note={editing} onSave={patch} onClose={closeEditor} />}
    </div>
  );
}
