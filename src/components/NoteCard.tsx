"use client";
import { useRef, useState, type CSSProperties } from "react";
import { COLOR_KEYS, noteClass } from "@/lib/colors";
import type { Note, NotePatch, Sort, View } from "@/lib/types";
import { ContextMenu, type MenuAction } from "./ContextMenu";
import { Highlight } from "./Highlight";
import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CopyIcon,
  EditIcon,
  LabelIcon,
  PaletteIcon,
  PinIcon,
  RestoreIcon,
  TrashIcon,
} from "./icons";

const DAY = 86_400_000;

type Props = {
  note: Note;
  view: View;
  index?: number;
  sort?: Sort;
  selecting?: boolean;
  selected?: boolean;
  manualFirst?: boolean;
  manualLast?: boolean;
  retentionDays?: number;
  query?: string;
  allLabels?: string[];
  onOpen: (n: Note) => void;
  onPatch: (id: string, p: NotePatch) => void;
  onDelete: (id: string) => void;
  onCopy?: (n: Note) => void;
  onToggleSelect?: (id: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const btn =
  "grid h-11 w-11 place-items-center text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]";

export function NoteCard({
  note,
  view,
  index = 0,
  sort = "updated",
  selecting = false,
  selected = false,
  manualFirst = false,
  manualLast = false,
  retentionDays = 0,
  query,
  allLabels = [],
  onOpen,
  onPatch,
  onDelete,
  onCopy,
  onToggleSelect,
  onMove,
}: Props) {
  const [leaving, setLeaving] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const openMenu = (x: number, y: number) => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMenu({ x, y });
  };

  const leave = (fn: () => void) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(fn, 170);
  };

  const toggle = (itemId: string) =>
    onPatch(note.id, { items: note.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) });

  const showUntitled = !note.title && !(note.type === "text" && note.content);

  const daysLeft =
    view === "trash" && retentionDays > 0 && note.trashedAt
      ? Math.max(0, Math.ceil((note.trashedAt + retentionDays * DAY - Date.now()) / DAY))
      : null;

  const manual = sort === "manual" && view !== "trash" && !selecting;

  const items: MenuAction[] = [];
  if (view === "trash") {
    items.push({
      key: "restore",
      label: "Restore",
      icon: <RestoreIcon />,
      onSelect: () => leave(() => onPatch(note.id, { trashed: false })),
    });
    items.push({
      key: "delete",
      label: "Delete forever",
      icon: <TrashIcon />,
      onSelect: () => leave(() => onDelete(note.id)),
    });
  } else {
    items.push({ key: "open", label: "Open", icon: <EditIcon />, onSelect: () => onOpen(note) });
    items.push({
      key: "pin",
      label: note.pinned ? "Unpin" : "Pin",
      icon: <PinIcon filled={note.pinned} />,
      onSelect: () => onPatch(note.id, { pinned: !note.pinned }),
    });
    items.push({
      key: "archive",
      label: note.archived ? "Unarchive" : "Archive",
      icon: <ArchiveIcon />,
      onSelect: () => leave(() => onPatch(note.id, { archived: !note.archived })),
    });
    items.push({
      key: "trash",
      label: "Move to trash",
      icon: <TrashIcon />,
      onSelect: () => leave(() => onPatch(note.id, { trashed: true })),
    });
  }
  items.push({
    key: "copy",
    label: "Copy note text",
    icon: <CopyIcon />,
    separatorBefore: true,
    onSelect: () => onCopy?.(note),
  });
  if (view !== "trash") {
    items.push({
      key: "color",
      label: "Color",
      icon: <PaletteIcon />,
      separatorBefore: true,
      submenu: COLOR_KEYS.map((c) => ({
        key: `color-${c}`,
        label: cap(c),
        checked: note.color === c,
        checkRole: "radio",
        onSelect: () => onPatch(note.id, { color: c }),
      })),
    });
    items.push({
      key: "labels",
      label: "Labels",
      icon: <LabelIcon />,
      submenu: allLabels.length
        ? allLabels.map((l) => ({
            key: `label-${l}`,
            label: l,
            checked: note.labels.includes(l),
            checkRole: "checkbox",
            onSelect: () =>
              onPatch(note.id, {
                labels: note.labels.includes(l) ? note.labels.filter((x) => x !== l) : [...note.labels, l],
              }),
          }))
        : [{ key: "no-labels", label: "No labels yet", disabled: true }],
    });
  }

  return (
    <article
      data-note-id={note.id}
      onContextMenu={(e) => {
        if (selecting) return;
        e.preventDefault();
        openMenu(e.clientX, e.clientY);
      }}
      className={`nb nb-card group relative mb-3 break-inside-avoid p-3 ${noteClass(note.color)} ${
        leaving ? "leaving" : ""
      } ${selected ? "outline outline-[3px] outline-offset-2 outline-[var(--text)]" : ""}`}
      style={leaving ? undefined : ({ "--enter-delay": `${Math.min(index, 12) * 35}ms` } as CSSProperties)}
    >
      {note.pinned && view === "notes" && (
        <span className="absolute right-2 top-2 border-2 border-[var(--border)] bg-[var(--text)] px-1.5 py-0.5 text-xs font-bold text-[var(--bg)]">
          Pinned
        </span>
      )}

      {selecting && (
        <span
          aria-hidden="true"
          className={`absolute left-2 top-2 grid h-6 w-6 place-items-center border-2 border-[var(--border)] ${
            selected ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--surface)]"
          }`}
        >
          {selected && <CheckIcon className="h-4 w-4" />}
        </span>
      )}

      <button
        type="button"
        onClick={() => (selecting ? onToggleSelect?.(note.id) : onOpen(note))}
        onKeyDown={(e) => {
          if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
            e.preventDefault();
            const r = e.currentTarget.getBoundingClientRect();
            openMenu(r.left + 24, r.top + 24);
          }
        }}
        aria-pressed={selecting ? selected : undefined}
        aria-label={selecting ? `${selected ? "Deselect" : "Select"} ${note.title || "note"}` : undefined}
        className={`block min-h-11 w-full px-1 py-1.5 text-left ${note.pinned && view === "notes" ? "pr-20" : ""} ${
          selecting ? "pl-8" : ""
        }`}
      >
        {note.title && (
          <span className="mb-1 block font-bold">
            <Highlight text={note.title} query={query} />
          </span>
        )}
        {showUntitled && <span className="mb-1 block text-sm font-medium text-[var(--muted)]">Untitled</span>}
        {note.type === "text" && note.content && (
          <span className="line-clamp-12 whitespace-pre-wrap text-sm">
            <Highlight text={note.content} query={query} />
          </span>
        )}
        {note.images.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1">
            {note.images.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="h-20 w-20 border-2 border-[var(--border)] object-cover"
              />
            ))}
            {note.images.length > 4 && (
              <span className="grid h-20 w-20 place-items-center border-2 border-[var(--border)] text-xs font-bold">
                +{note.images.length - 4}
              </span>
            )}
          </span>
        )}
      </button>

      {note.type === "list" && (
        <ul className="mt-1 space-y-0.5">
          {note.items.slice(0, 10).map((i) => (
            <li key={i.id}>
              {selecting ? (
                <span className="flex min-h-11 items-center gap-2 pl-8 text-sm">
                  <span className={`h-4 w-4 shrink-0 border-2 border-[var(--border)] ${i.done ? "bg-[var(--text)]" : ""}`} />
                  <span className={i.done ? "text-[var(--muted)] line-through" : ""}>
                    <Highlight text={i.text} query={query} />
                  </span>
                </span>
              ) : (
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={i.done}
                    onChange={() => toggle(i.id)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className={i.done ? "text-[var(--muted)] line-through" : ""}>
                    <Highlight text={i.text} query={query} />
                  </span>
                </label>
              )}
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

      {daysLeft !== null && (
        <p className="mt-2 text-xs font-bold text-[var(--muted)]">
          {daysLeft > 0 ? `Deletes in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : "Deleting soon"}
        </p>
      )}

      {!selecting && (
        <div
          className={`mt-2 flex gap-1 ${
            manual ? "" : "md:opacity-0 md:transition md:group-focus-within:opacity-100 md:group-hover:opacity-100"
          }`}
        >
          {manual && (
            <>
              <button
                type="button"
                className={`${btn} disabled:opacity-30 disabled:hover:bg-transparent`}
                title="Move earlier"
                aria-label="Move earlier"
                disabled={manualFirst}
                onClick={() => onMove?.(note.id, -1)}
              >
                <ArrowUpIcon />
              </button>
              <button
                type="button"
                className={`${btn} disabled:opacity-30 disabled:hover:bg-transparent`}
                title="Move later"
                aria-label="Move later"
                disabled={manualLast}
                onClick={() => onMove?.(note.id, 1)}
              >
                <ArrowDownIcon />
              </button>
            </>
          )}
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
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={items}
          label={note.title || "Note"}
          onClose={() => setMenu(null)}
          returnFocusTo={openerRef.current}
        />
      )}
    </article>
  );
}
