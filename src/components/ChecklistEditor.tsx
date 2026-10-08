"use client";
import type { Note } from "@/lib/types";
import { uid } from "@/lib/util";
import { CloseIcon } from "./icons";

type Item = Note["items"][number];

export function ChecklistEditor({ items, onChange }: { items: Item[]; onChange: (i: Item[]) => void }) {
  const set = (id: string, p: Partial<Item>) => onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  return (
    <div className="space-y-0.5">
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-1">
          <label className="grid h-11 w-11 shrink-0 place-items-center rounded hover:bg-[var(--hover)]">
            <input
              type="checkbox"
              checked={i.done}
              onChange={(e) => set(i.id, { done: e.target.checked })}
              className="h-4 w-4"
              aria-label={`Mark "${i.text}" ${i.done ? "not done" : "done"}`}
            />
          </label>
          <input
            value={i.text}
            onChange={(e) => set(i.id, { text: e.target.value })}
            className={`min-h-11 min-w-0 flex-1 bg-transparent text-sm ${
              i.done ? "text-[var(--muted)] line-through" : ""
            }`}
          />
          <button
            type="button"
            aria-label={`Remove "${i.text}"`}
            onClick={() => onChange(items.filter((x) => x.id !== i.id))}
            className="grid h-11 w-11 shrink-0 place-items-center rounded text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      <input
        placeholder="+ List item"
        aria-label="New list item"
        onKeyDown={(e) => {
          const v = e.currentTarget.value.trim();
          if (e.key === "Enter" && v) {
            onChange([...items, { id: uid(), text: v, done: false }]);
            e.currentTarget.value = "";
          }
        }}
        className="min-h-11 w-full bg-transparent text-sm placeholder:text-[var(--muted)]"
      />
    </div>
  );
}
