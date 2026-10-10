import { getDb } from "./db";
import type { ImportedNote, Note, NoteInput, NotePatch, Sort, View } from "./types";

type Row = {
  id: string; title: string; content: string; type: Note["type"]; items: string;
  images: string; color: Note["color"]; pinned: number; archived: number; labels: string;
  trashed_at: number | null; position: number; created_at: number; updated_at: number;
};

const toNote = (r: Row): Note => ({
  id: r.id,
  title: r.title,
  content: r.content,
  type: r.type,
  items: JSON.parse(r.items) as Note["items"],
  images: JSON.parse(r.images ?? "[]") as Note["images"],
  color: r.color,
  pinned: r.pinned === 1,
  archived: r.archived === 1,
  labels: JSON.parse(r.labels) as string[],
  trashedAt: r.trashed_at,
  position: r.position,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const DAY = 86_400_000;

export function retentionDays(): number {
  const v = Number(process.env.TRASH_RETENTION_DAYS);
  return Number.isFinite(v) && v >= 0 ? v : 30;
}

export function purgeTrash(): number {
  const days = retentionDays();
  if (days <= 0) return 0;
  return getDb().prepare("DELETE FROM notes WHERE trashed_at IS NOT NULL AND trashed_at < ?").run(Date.now() - days * DAY).changes;
}

export function getNote(id: string): Note | null {
  const r = getDb().prepare("SELECT * FROM notes WHERE id = ?").get(id) as Row | undefined;
  return r ? toNote(r) : null;
}

// Quote each term so arbitrary input cannot break the MATCH grammar, and add a
// prefix wildcard so "cat" also finds "category".
function ftsQuery(q: string): string | null {
  const terms = q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t.replace(/"/g, '""')}"*`);
  return terms.length ? terms.join(" ") : null;
}

export function listNotes(view: View, q?: string, label?: string, sort: Sort = "updated"): Note[] {
  const where: string[] = [];
  const args: string[] = [];

  if (view === "trash") where.push("trashed_at IS NOT NULL");
  else where.push("trashed_at IS NULL", view === "archive" ? "archived = 1" : "archived = 0");

  if (q) {
    const match = ftsQuery(q);
    if (match) {
      where.push("rowid IN (SELECT rowid FROM notes_fts WHERE notes_fts MATCH ?)");
      args.push(match);
    } else {
      const like = `%${q}%`;
      where.push("(title LIKE ? OR content LIKE ? OR items LIKE ?)");
      args.push(like, like, like);
    }
  }
  if (label) {
    where.push("EXISTS (SELECT 1 FROM json_each(notes.labels) WHERE value = ?)");
    args.push(label);
  }

  const order =
    sort === "created"
      ? "pinned DESC, created_at DESC"
      : sort === "title"
        ? "pinned DESC, title COLLATE NOCASE ASC"
        : sort === "manual"
          ? "pinned DESC, position ASC, updated_at DESC"
          : "pinned DESC, updated_at DESC";

  const sql = `SELECT * FROM notes WHERE ${where.join(" AND ")} ORDER BY ${order}`;
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
      `INSERT INTO notes (id,title,content,type,items,images,color,pinned,archived,labels,position,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(id, i.title, i.content, i.type, JSON.stringify(i.items), JSON.stringify(i.images), i.color, i.pinned ? 1 : 0, i.archived ? 1 : 0, JSON.stringify(i.labels), now, now, now);
  return getNote(id) as Note;
}

export function updateNote(id: string, p: NotePatch): Note | null {
  const cur = getNote(id);
  if (!cur) return null;

  const now = Date.now();
  const trashedAt = p.trashed === undefined ? cur.trashedAt : p.trashed ? now : null;

  getDb()
    .prepare(
      `UPDATE notes SET title=?, content=?, type=?, items=?, images=?, color=?, pinned=?, archived=?, labels=?, trashed_at=?, updated_at=?
       WHERE id=?`,
    )
    .run(
      p.title ?? cur.title,
      p.content ?? cur.content,
      p.type ?? cur.type,
      JSON.stringify(p.items ?? cur.items),
      JSON.stringify(p.images ?? cur.images),
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

const relabel = (mutate: (labels: string[]) => string[] | null): number => {
  const db = getDb();
  const rows = db.prepare("SELECT id, labels FROM notes").all() as { id: string; labels: string }[];
  const up = db.prepare("UPDATE notes SET labels = ? WHERE id = ?");
  let n = 0;
  db.transaction(() => {
    for (const r of rows) {
      const next = mutate(JSON.parse(r.labels) as string[]);
      if (!next) continue;
      up.run(JSON.stringify(next), r.id);
      n++;
    }
  })();
  return n;
};

export function renameLabel(from: string, to: string): number {
  if (from === to) return 0;
  return relabel((labels) => {
    if (!labels.includes(from)) return null;
    const next: string[] = [];
    for (const l of labels) {
      const v = l === from ? to : l;
      if (!next.includes(v)) next.push(v);
    }
    return next;
  });
}

export function deleteLabel(name: string): number {
  return relabel((labels) => (labels.includes(name) ? labels.filter((l) => l !== name) : null));
}

export function reorderNotes(ids: string[]): number {
  const db = getDb();
  const up = db.prepare("UPDATE notes SET position = ? WHERE id = ?");
  db.transaction(() => ids.forEach((id, i) => up.run(i, id)))();
  return ids.length;
}

export function importNotes(notes: ImportedNote[]): { imported: number } {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(
    `INSERT INTO notes (id,title,content,type,items,images,color,pinned,archived,labels,trashed_at,position,created_at,updated_at)
     VALUES (@id,@title,@content,@type,@items,@images,@color,@pinned,@archived,@labels,@trashed_at,@position,@created_at,@updated_at)
     ON CONFLICT(id) DO UPDATE SET
       title=@title, content=@content, type=@type, items=@items, images=@images, color=@color,
       pinned=@pinned, archived=@archived, labels=@labels, trashed_at=@trashed_at,
       position=@position, updated_at=@updated_at`,
  );
  const tx = db.transaction((list: ImportedNote[]) => {
    for (const n of list) {
      stmt.run({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
        items: JSON.stringify(n.items),
        images: JSON.stringify(n.images),
        color: n.color,
        pinned: n.pinned ? 1 : 0,
        archived: n.archived ? 1 : 0,
        labels: JSON.stringify(n.labels),
        trashed_at: n.trashedAt ?? null,
        position: n.position ?? 0,
        created_at: n.createdAt ?? now,
        updated_at: n.updatedAt ?? n.createdAt ?? now,
      });
    }
  });
  tx(notes);
  return { imported: notes.length };
}

export function exportAllNotes(): Note[] {
  return (getDb().prepare("SELECT * FROM notes").all() as Row[]).map(toNote);
}
