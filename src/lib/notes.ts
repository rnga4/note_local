import { getDb } from "./db";
import type { Note, NoteInput, NotePatch, View } from "./types";

type Row = {
  id: string; title: string; content: string; type: Note["type"]; items: string;
  color: Note["color"]; pinned: number; archived: number; labels: string;
  trashed_at: number | null; created_at: number; updated_at: number;
};

const toNote = (r: Row): Note => ({
  id: r.id,
  title: r.title,
  content: r.content,
  type: r.type,
  items: JSON.parse(r.items) as Note["items"],
  color: r.color,
  pinned: r.pinned === 1,
  archived: r.archived === 1,
  labels: JSON.parse(r.labels) as string[],
  trashedAt: r.trashed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function getNote(id: string): Note | null {
  const r = getDb().prepare("SELECT * FROM notes WHERE id = ?").get(id) as Row | undefined;
  return r ? toNote(r) : null;
}

export function listNotes(view: View, q?: string, label?: string): Note[] {
  const where: string[] = [];
  const args: string[] = [];

  if (view === "trash") where.push("trashed_at IS NOT NULL");
  else where.push("trashed_at IS NULL", view === "archive" ? "archived = 1" : "archived = 0");

  if (q) {
    const like = `%${q}%`;
    where.push("(title LIKE ? OR content LIKE ? OR items LIKE ?)");
    args.push(like, like, like);
  }
  if (label) {
    where.push("EXISTS (SELECT 1 FROM json_each(notes.labels) WHERE value = ?)");
    args.push(label);
  }

  const sql = `SELECT * FROM notes WHERE ${where.join(" AND ")} ORDER BY pinned DESC, updated_at DESC`;
  return (getDb().prepare(sql).all(...args) as Row[]).map(toNote);
}

export function listLabels(): string[] {
  const rows = getDb()
    .prepare("SELECT DISTINCT value AS l FROM notes, json_each(notes.labels) WHERE trashed_at IS NULL ORDER BY l")
    .all() as { l: string }[];
  return rows.map((r) => r.l);
}

export function createNote(i: NoteInput): Note {
  const now = Date.now();
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO notes (id,title,content,type,items,color,pinned,archived,labels,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(id, i.title, i.content, i.type, JSON.stringify(i.items), i.color, i.pinned ? 1 : 0, i.archived ? 1 : 0, JSON.stringify(i.labels), now, now);
  return getNote(id) as Note;
}

export function updateNote(id: string, p: NotePatch): Note | null {
  const cur = getNote(id);
  if (!cur) return null;

  const now = Date.now();
  const trashedAt = p.trashed === undefined ? cur.trashedAt : p.trashed ? now : null;

  getDb()
    .prepare(
      `UPDATE notes SET title=?, content=?, type=?, items=?, color=?, pinned=?, archived=?, labels=?, trashed_at=?, updated_at=?
       WHERE id=?`,
    )
    .run(
      p.title ?? cur.title,
      p.content ?? cur.content,
      p.type ?? cur.type,
      JSON.stringify(p.items ?? cur.items),
      p.color ?? cur.color,
      (p.pinned ?? cur.pinned) ? 1 : 0,
      (p.archived ?? cur.archived) ? 1 : 0,
      JSON.stringify(p.labels ?? cur.labels),
      trashedAt,
      now,
      id,
    );
  return getNote(id);
}

export function deleteNote(id: string): boolean {
  return getDb().prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}

export function emptyTrash(): number {
  return getDb().prepare("DELETE FROM notes WHERE trashed_at IS NOT NULL").run().changes;
}

export function trashCount(): number {
  return (getDb().prepare("SELECT COUNT(*) AS c FROM notes WHERE trashed_at IS NOT NULL").get() as { c: number }).c;
}

export function exportAllNotes(): Note[] {
  return (getDb().prepare("SELECT * FROM notes").all() as Row[]).map(toNote);
}
