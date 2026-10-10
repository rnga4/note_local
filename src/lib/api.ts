import type { Note, NoteInput, NotePatch, Sort, View } from "./types";

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}
const H = { "Content-Type": "application/json" };

export const api = {
  list: (view: View, q = "", label = "", sort: Sort = "updated") => {
    const sp = new URLSearchParams({ view, sort });
    if (q) sp.set("q", q);
    if (label) sp.set("label", label);
    return fetch(`/api/notes?${sp}`, { cache: "no-store" }).then(j<Note[]>);
  },
  create: (b: NoteInput) =>
    fetch("/api/notes", { method: "POST", headers: H, body: JSON.stringify(b) }).then(j<Note>),
  patch: (id: string, b: NotePatch) =>
    fetch(`/api/notes/${id}`, { method: "PATCH", headers: H, body: JSON.stringify(b) }).then(j<Note>),
  remove: (id: string) => fetch(`/api/notes/${id}`, { method: "DELETE" }).then(() => undefined),
  emptyTrash: () => fetch("/api/notes", { method: "DELETE" }).then(() => undefined),
  labels: () =>
    fetch("/api/labels", { cache: "no-store" }).then(
      j<{ labels: string[]; trashedCount: number; retentionDays: number }>,
    ),
  importJson: (data: unknown) =>
    fetch("/api/import", { method: "POST", headers: H, body: JSON.stringify(data) }).then(j<{ imported: number }>),
  renameLabel: (from: string, to: string) =>
    fetch("/api/labels", { method: "PATCH", headers: H, body: JSON.stringify({ from, to }) }).then(
      j<{ renamed: number }>,
    ),
  deleteLabel: (name: string) =>
    fetch(`/api/labels?name=${encodeURIComponent(name)}`, { method: "DELETE" }).then(j<{ removed: number }>),
  reorder: (ids: string[]) =>
    fetch("/api/notes/reorder", { method: "POST", headers: H, body: JSON.stringify({ ids }) }).then(
      j<{ reordered: number }>,
    ),
};
