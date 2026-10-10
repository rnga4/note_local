"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  cachedList,
  cachedMeta,
  cacheList,
  cacheMeta,
  enqueue,
  getQueue,
  pendingCount,
  setQueue,
  type Op,
} from "@/lib/offline";
import type { Note, NoteInput, NotePatch, Sort, View } from "@/lib/types";
import { uid } from "@/lib/util";
import { Composer } from "./Composer";
import { MenuIcon } from "./icons";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import { NavList, Sidebar } from "./Sidebar";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { Toast } from "./Toast";

type Status = "loading" | "ready" | "error";

const linkBtn =
  "min-h-11 px-2 text-sm font-bold text-[var(--text)] underline decoration-2 underline-offset-4 hover:bg-[var(--hover)]";

const bulkBtn = "nb-btn min-h-11 px-3 text-sm font-bold text-[var(--text)]";

export function NotesApp({ authEnabled = false }: { authEnabled?: boolean }) {
  const [view, setView] = useState<View>("notes");
  const [q, setQ] = useState("");
  const [label, setLabel] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const [retentionDays, setRetentionDays] = useState(0);
  const [editing, setEditing] = useState<Note | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [helpOpen, setHelpOpen] = useState(false);
  const notesRef = useRef(notes);
  const openerRef = useRef<HTMLElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const gRef = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string; undo?: () => void } | null>(null);
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("note-sort");
      if (s === "updated" || s === "created" || s === "title" || s === "manual") setSort(s);
    } catch {
      /* storage can be blocked; the default sort still applies */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("note-sort", sort);
    } catch {
      /* storage can be blocked; the choice still applies for this session */
    }
  }, [sort]);

  const refresh = useCallback(async () => {
    const key = `${view}|${label}|${sort}|${q}`;
    try {
      const [n, r] = await Promise.all([api.list(view, q, label, sort), api.labels()]);
      setNotes(n);
      setLabels(r.labels);
      setTrashCount(r.trashedCount);
      setRetentionDays(r.retentionDays);
      setLoadedScope(`${view}\u0000${label}`);
      setStatus("ready");
      setOffline(false);
      cacheList(key, n);
      cacheMeta(r);
    } catch (e) {
      const cached = cachedList(key);
      const meta = cachedMeta();
      if (cached) {
        setNotes(cached);
        if (meta) {
          setLabels(meta.labels);
          setTrashCount(meta.trashedCount);
          setRetentionDays(meta.retentionDays);
        }
        setLoadedScope(`${view}\u0000${label}`);
        setStatus("ready");
        setOffline(true);
      } else {
        console.error(e);
        setStatus("error");
      }
    }
  }, [view, q, label, sort]);

  useEffect(() => {
    setStatus((s) => (s === "error" ? s : "loading"));
    const t = setTimeout(() => void refresh(), 200);
    return () => clearTimeout(t);
  }, [refresh]);

  const markPending = () => setPending(pendingCount());

  // A mutation that fails because the server is unreachable is queued for later
  // instead of being lost; the optimistic local state already reflects it.
  const syncOrQueue = async (online: () => Promise<unknown>, op: Op) => {
    try {
      await online();
      await refresh();
    } catch {
      enqueue(op);
      markPending();
      setOffline(true);
      setToast({ id: Date.now(), msg: "Saved offline. It will sync when you reconnect." });
    }
  };

  // Mirrors the server's list filtering so an offline change leaves the list correctly.
  const visible = (n: Note): boolean => {
    if (view === "trash") return Boolean(n.trashedAt);
    if (n.trashedAt) return false;
    if (view === "archive") return n.archived;
    if (n.archived) return false;
    if (label && !n.labels.includes(label)) return false;
    if (q) {
      const hay = `${n.title} ${n.content} ${n.items.map((i) => i.text).join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  };

  const create = (n: NoteInput) => {
    const now = Date.now();
    const local: Note = { ...n, id: uid(), trashedAt: null, position: now, createdAt: now, updatedAt: now };
    setNotes((ns) => [local, ...ns].filter(visible));
    void syncOrQueue(() => api.create(n), { k: "upsert", note: local });
  };

  const patch = async (id: string, p: NotePatch) => {
    const target = notesRef.current.find((n) => n.id === id);
    const { trashed, ...fields } = p;
    const next: Note | null = target
      ? {
          ...target,
          ...fields,
          trashedAt: trashed === undefined ? target.trashedAt : trashed ? Date.now() : null,
        }
      : null;
    setNotes((ns) => {
      const mapped = ns.map((n) =>
        n.id === id ? { ...n, ...fields, trashedAt: next?.trashedAt ?? n.trashedAt } : n,
      );
      // online, let the card finish its leave animation before refresh re-filters
      return navigator.onLine ? mapped : mapped.filter(visible);
    });
    if (p.trashed === true) {
      setToast({ id: Date.now(), msg: "Note moved to trash", undo: () => void patch(id, { trashed: false }) });
    }
    try {
      await api.patch(id, p);
      await refresh();
    } catch {
      if (next) {
        enqueue({ k: "upsert", note: next });
        markPending();
      }
      setOffline(true);
    }
  };

  const remove = (id: string) => {
    setNotes((ns) => ns.filter((n) => n.id !== id));
    void syncOrQueue(() => api.remove(id), { k: "remove", id });
  };

  const emptyTrash = () => {
    if (view === "trash") setNotes([]);
    setTrashCount(0);
    void syncOrQueue(() => api.emptyTrash(), { k: "emptyTrash" });
  };

  const flushQueue = useCallback(async () => {
    const queue = getQueue();
    for (const op of queue) {
      if (op.k === "upsert") await api.importJson([op.note]);
      else if (op.k === "remove") await api.remove(op.id);
      else await api.emptyTrash();
    }
    if (queue.length) {
      setQueue([]);
      markPending();
    }
  }, []);

  useEffect(() => {
    const onOnline = () => {
      void (async () => {
        try {
          await flushQueue();
        } catch {
          // still unreachable; the queue stays and we retry on the next online event
        }
        await refresh();
      })();
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setPending(pendingCount());
    if (!navigator.onLine) setOffline(true);
    else if (pendingCount() > 0) onOnline();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushQueue, refresh]);

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
    setSelected(new Set());
    setSelecting(false);
    requestAnimationFrame(() => menuBtnRef.current?.focus());
  };
  const goLabel = (l: string) => {
    setView("notes");
    setLabel(l);
    setNavOpen(false);
    setSelected(new Set());
    setSelecting(false);
    requestAnimationFrame(() => menuBtnRef.current?.focus());
  };
  const toggleNav = () => {
    const next = !navOpen;
    setNavOpen(next);
    if (!next) requestAnimationFrame(() => menuBtnRef.current?.focus());
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelecting = () => {
    setSelecting((s) => {
      if (s) setSelected(new Set());
      return !s;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setSelecting(false);
  };

  const allSelected = notes.length > 0 && selected.size === notes.length;
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(notes.map((n) => n.id)));

  const bulk = async (fn: (id: string) => Promise<unknown>, msg: string) => {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(fn));
      await refresh();
      setToast({ id: Date.now(), msg });
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
    setSelected(new Set());
    setSelecting(false);
  };

  const bulkPatch = (p: NotePatch, msg: string) => bulk((id) => api.patch(id, p), msg);
  const bulkDelete = () => bulk((id) => api.remove(id), "Notes deleted forever");

  const bulkAddLabel = (name: string) => {
    const value = name.trim();
    if (!value) return;
    void bulk((id) => {
      const n = notesRef.current.find((x) => x.id === id);
      const labels = Array.from(new Set([...(n?.labels ?? []), value]));
      return api.patch(id, { labels });
    }, `Label "${value}" added`);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = notes.findIndex((n) => n.id === id);
    const j = i + dir;
    const a = notes[i];
    const b = notes[j];
    if (!a || !b) return;
    const next = notes.slice();
    next[i] = b;
    next[j] = a;
    setNotes(next);
    void api.reorder(next.map((n) => n.id)).catch((e) => {
      console.error(e);
      setStatus("error");
    });
  };

  const renameLabel = async (from: string, to: string) => {
    try {
      const { renamed } = await api.renameLabel(from, to);
      if (label === from) setLabel(to);
      await refresh();
      setToast({ id: Date.now(), msg: renamed ? `Label renamed in ${renamed} notes` : "Nothing to rename" });
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const deleteLabel = async (name: string) => {
    try {
      const { removed } = await api.deleteLabel(name);
      if (label === name) {
        setLabel("");
        setView("notes");
      }
      await refresh();
      setToast({ id: Date.now(), msg: removed ? `Label removed from ${removed} notes` : "Nothing to remove" });
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const copyNote = async (n: Note) => {
    const text = [n.title, n.content, ...n.items.map((i) => i.text)].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setToast({ id: Date.now(), msg: "Note copied" });
    } catch {
      setToast({ id: Date.now(), msg: "Copy failed. Your browser blocked clipboard access." });
    }
  };

  const importFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const { imported } = await api.importJson(data);
      await refresh();
      setToast({ id: Date.now(), msg: `Imported ${imported} notes` });
    } catch (e) {
      console.error(e);
      setToast({ id: Date.now(), msg: "Import failed: not a valid backup file" });
    }
  };

  // Shortcuts read the latest state and callbacks through refs, so the listener mounts once.
  const stateRef = useRef({ view, editing, selecting, notes });
  const cbRef = useRef({ goView, openEditor, clearSelection, toggleSelecting, patch });
  useEffect(() => {
    stateRef.current = { view, editing, selecting, notes };
    cbRef.current = { goView, openEditor, clearSelection, toggleSelecting, patch };
  });

  useEffect(() => {
    const focusedNoteId = () => {
      const el = document.activeElement as HTMLElement | null;
      const card = el?.closest?.("[data-note-id]") as HTMLElement | null;
      return card?.dataset.noteId ?? null;
    };

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"], [role="menu"]')) return;

      if (gRef.current) {
        gRef.current = false;
        if (gTimer.current) clearTimeout(gTimer.current);
        if (e.key === "n") cbRef.current.goView("notes");
        else if (e.key === "a") cbRef.current.goView("archive");
        else if (e.key === "t") cbRef.current.goView("trash");
        return;
      }
      if (e.key === "g") {
        gRef.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = setTimeout(() => {
          gRef.current = false;
        }, 1000);
        return;
      }
      if (e.key === "c") {
        e.preventDefault();
        window.dispatchEvent(new Event("note:compose"));
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (e.key === "x") {
        e.preventDefault();
        cbRef.current.toggleSelecting();
        return;
      }
      if (e.key === "Escape") {
        if (s.selecting) {
          e.preventDefault();
          cbRef.current.clearSelection();
        }
        return;
      }
      if (e.key === "e" && !s.selecting && s.view !== "trash") {
        const id = focusedNoteId();
        const n = id ? s.notes.find((x) => x.id === id) : undefined;
        if (n) {
          e.preventDefault();
          cbRef.current.openEditor(n);
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !s.selecting && s.view !== "trash") {
        const id = focusedNoteId();
        if (id) {
          e.preventDefault();
          void cbRef.current.patch(id, { trashed: true });
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, []);

  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);
  const showSections = view === "notes" && sort !== "manual" && pinned.length > 0 && others.length > 0;

  const grid = (list: Note[]) => (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
      {list.map((n, idx) => (
        <NoteCard
          key={n.id}
          note={n}
          view={view}
          index={idx}
          sort={sort}
          selecting={selecting}
          selected={selected.has(n.id)}
          manualFirst={sort === "manual" && view !== "trash" && idx === 0}
          manualLast={sort === "manual" && view !== "trash" && idx === list.length - 1}
          retentionDays={retentionDays}
          query={q}
          allLabels={labels}
          onOpen={openEditor}
          onPatch={patch}
          onDelete={remove}
          onCopy={copyNote}
          onToggleSelect={toggleSelect}
          onMove={move}
        />
      ))}
    </div>
  );

  const navProps = {
    view,
    label,
    labels,
    trashCount,
    sort,
    onView: goView,
    onLabel: goLabel,
    onEmptyTrash: emptyTrash,
    onSort: setSort,
    onImport: importFile,
    onRenameLabel: renameLabel,
    onDeleteLabel: deleteLabel,
    onHelp: () => {
      setHelpOpen(true);
      setNavOpen(false);
    },
    authEnabled,
    onLogout: () => {
      void fetch("/api/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/login";
    },
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
  } else if (sort === "manual" && view !== "trash") {
    body = grid(notes);
  } else {
    body = (
      <>
        {showSections && <h2 className="mb-2 text-sm font-black tracking-tight">Pinned</h2>}
        {pinned.length > 0 && grid(pinned)}
        {showSections && others.length > 0 && (
          <h2 className="mb-2 mt-6 text-sm font-black tracking-tight">Others</h2>
        )}
        {others.length > 0 && grid(others)}
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 px-2 py-1.5 md:gap-4 md:px-4 md:py-2">
          <button
            ref={menuBtnRef}
            type="button"
            onClick={toggleNav}
            aria-label={navOpen ? "Hide menu" : "Show menu"}
            aria-expanded={navOpen}
            aria-controls="nav-panel"
            className="nb-btn grid h-11 w-11 shrink-0 place-items-center text-[var(--text)] md:hidden"
          >
            <MenuIcon />
          </button>
          <h1 className="shrink-0 text-lg font-black tracking-tight">Notes</h1>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) {
                e.preventDefault();
                setQ("");
              }
            }}
            placeholder="Search notes"
            aria-label="Search notes"
            aria-keyshortcuts="/"
            title="Search notes (press /)"
            className="nb min-h-11 min-w-0 flex-1 px-3 text-sm placeholder:text-[var(--muted)] md:max-w-xl"
          />
          <button
            type="button"
            onClick={toggleSelecting}
            aria-pressed={selecting}
            className={`nb-btn min-h-11 shrink-0 px-3 text-sm font-bold ${
              selecting ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--text)]"
            }`}
          >
            {selecting ? "Done" : "Select"}
          </button>
        </div>
        <div
          id="nav-panel"
          aria-hidden={!navOpen}
          inert={!navOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden ${
            navOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t-2 border-[var(--border)] px-2 py-2">
              <NavList {...navProps} />
            </div>
          </div>
        </div>
      </header>

      {offline && (
        <div
          role="status"
          className="border-b-2 border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-center text-sm font-bold text-[var(--accent-ink)]"
        >
          {pending > 0
            ? `Offline. ${pending} change${pending === 1 ? "" : "s"} will sync when you reconnect.`
            : "Offline. Showing saved notes."}
        </div>
      )}

      <div className="flex">
        <Sidebar {...navProps} />
        <main className={`min-w-0 flex-1 p-4 ${selecting ? "pb-56 md:pb-28" : ""}`}>
          {view === "notes" && <Composer onCreate={create} />}
          {body}
        </main>
      </div>

      {editing && <NoteEditor key={editing.id} note={editing} onSave={patch} onClose={closeEditor} />}
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}

      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[45vh] overflow-y-auto border-t-2 border-[var(--border)] bg-[var(--surface)] p-2">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
            <span className="px-1 text-sm font-black">{selected.size} selected</span>
            <button type="button" onClick={selectAll} className={bulkBtn}>
              {allSelected ? "Clear" : "Select all"}
            </button>
            <span className="hidden flex-1 sm:block" />
            <div className="flex flex-wrap items-center gap-2">
              {view === "trash" ? (
                <>
                  <button type="button" onClick={() => bulkPatch({ trashed: false }, "Notes restored")} className={bulkBtn}>
                    Restore
                  </button>
                  <button type="button" onClick={bulkDelete} className={bulkBtn}>
                    Delete forever
                  </button>
                </>
              ) : (
                <>
                  <label className="nb-btn flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-[var(--text)]">
                    Label
                    <input
                      placeholder="name"
                      aria-label="Add label to selected notes"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          bulkAddLabel(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="min-h-9 w-24 min-w-0 border-2 border-[var(--border)] bg-[var(--bg)] px-2 text-sm font-normal placeholder:text-[var(--muted)]"
                    />
                  </label>
                  <button type="button" onClick={() => bulkPatch({ archived: true }, "Notes archived")} className={bulkBtn}>
                    Archive
                  </button>
                  <button type="button" onClick={() => bulkPatch({ trashed: true }, "Notes moved to trash")} className={bulkBtn}>
                    Trash
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="min-h-11 px-3 text-sm font-bold text-[var(--text)] underline decoration-2 underline-offset-4 hover:bg-[var(--hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.msg}
          actionLabel={toast.undo ? "Undo" : undefined}
          onAction={toast.undo}
          onDismiss={() => setToast(null)}
          className={selecting ? "bottom-44 md:bottom-20" : "bottom-4"}
        />
      )}
    </div>
  );
}
