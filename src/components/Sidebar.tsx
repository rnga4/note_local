"use client";
import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import type { Sort, View } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { CheckIcon, EditIcon, TrashIcon } from "./icons";

type Props = {
  view: View;
  label: string;
  labels: string[];
  trashCount: number;
  sort: Sort;
  onView: (v: View) => void;
  onLabel: (l: string) => void;
  onEmptyTrash: () => void;
  onSort: (s: Sort) => void;
  onImport: (file: File) => void;
  onRenameLabel: (from: string, to: string) => void;
  onDeleteLabel: (name: string) => void;
  onHelp: () => void;
  authEnabled?: boolean;
  onLogout?: () => void;
  className?: string;
};

const item = (active: boolean) =>
  `flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm ${
    active
      ? "bg-[var(--text)] font-black text-[var(--bg)]"
      : "font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
  }`;

const miniBtn =
  "grid h-11 w-9 shrink-0 place-items-center text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]";

export function NavList({
  view,
  label,
  labels,
  trashCount,
  sort,
  onView,
  onLabel,
  onEmptyTrash,
  onSort,
  onImport,
  onRenameLabel,
  onDeleteLabel,
  onHelp,
  authEnabled = false,
  onLogout,
  className = "",
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const sortId = useId();

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  useEffect(() => {
    setConfirmDelete(null);
  }, [label, view]);

  const commitRename = (e: FormEvent) => {
    e.preventDefault();
    const to = draft.trim();
    if (editing && to && to !== editing) onRenameLabel(editing, to);
    setEditing(null);
  };

  const pickImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = "";
  };

  return (
    <nav className={`flex flex-col gap-1 ${className}`}>
      <button type="button" className={item(view === "notes" && !label)} onClick={() => onView("notes")}>
        Notes
      </button>

      {labels.map((l) => {
        const active = view === "notes" && label === l;
        if (editing === l) {
          return (
            <form key={l} onSubmit={commitRename} className="flex items-center gap-1 px-1">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditing(null);
                }}
                aria-label={`Rename label ${l}`}
                className="nb min-h-11 min-w-0 flex-1 px-2 text-sm"
              />
              <button type="submit" aria-label="Save label name" className="nb-btn grid h-11 w-11 place-items-center">
                <CheckIcon className="h-4 w-4" />
              </button>
            </form>
          );
        }
        return (
          <div key={l}>
            <div className="flex items-center">
              <button type="button" className={`${item(active)} flex-1`} onClick={() => onLabel(l)}>
                {l}
              </button>
              {active && (
                <>
                  <button
                    type="button"
                    aria-label={`Rename label ${l}`}
                    title="Rename label"
                    onClick={() => {
                      setEditing(l);
                      setDraft(l);
                    }}
                    className={miniBtn}
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete label ${l}`}
                    title="Delete label"
                    onClick={() => setConfirmDelete((c) => (c === l ? null : l))}
                    className={miniBtn}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {confirmDelete === l && (
              <button
                type="button"
                onClick={() => {
                  onDeleteLabel(l);
                  setConfirmDelete(null);
                }}
                className="min-h-11 w-full px-3 text-left text-xs font-bold text-[var(--text)] underline decoration-2 underline-offset-4 hover:bg-[var(--hover)]"
              >
                {`Confirm delete "${l}" from all notes?`}
              </button>
            )}
          </div>
        );
      })}

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
          className={`mt-2 min-h-11 px-3 text-left text-sm font-bold underline decoration-2 underline-offset-4 hover:bg-[var(--hover)] ${
            confirming ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          {confirming ? "Confirm empty trash?" : `Empty trash (${trashCount})`}
        </button>
      )}

      <div className="mt-3 flex flex-col gap-1 px-3 text-xs font-bold text-[var(--muted)]">
        <label htmlFor={sortId}>Sort</label>
        <select
          id={sortId}
          value={sort}
          onChange={(e) => onSort(e.target.value as Sort)}
          className="nb min-h-11 px-2 text-sm font-medium text-[var(--text)]"
        >
          <option value="updated">Last updated</option>
          <option value="created">Date created</option>
          <option value="title">Title, A to Z</option>
          <option value="manual">Manual order</option>
        </select>
      </div>

      <ThemeToggle className="mt-3" />

      <label className="mt-1 flex min-h-11 cursor-pointer items-center px-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
        Import backup
        <input type="file" accept=".json,application/json" className="hidden" onChange={pickImport} />
      </label>
      <a
        href="/api/export"
        download
        className="flex min-h-11 items-center px-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
      >
        Download backup
      </a>
      <button
        type="button"
        onClick={onHelp}
        className="flex min-h-11 items-center justify-between px-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
      >
        Keyboard shortcuts
        <kbd className="rounded border-2 border-[var(--border)] px-1 text-xs font-bold text-[var(--muted)]">?</kbd>
      </button>
      {authEnabled && (
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 items-center px-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          Log out
        </button>
      )}
    </nav>
  );
}

export function Sidebar(props: Props) {
  return (
    <aside className="hidden w-56 shrink-0 border-r-2 border-[var(--border)] py-3 md:block">
      <NavList {...props} />
    </aside>
  );
}
