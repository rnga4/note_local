import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { __noteDb?: Database.Database };

export function getDb(): Database.Database {
  if (globalForDb.__noteDb) return globalForDb.__noteDb;

  const file = process.env.DB_PATH ?? path.join(process.cwd(), "data", "notes.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      title      TEXT    NOT NULL DEFAULT '',
      content    TEXT    NOT NULL DEFAULT '',
      type       TEXT    NOT NULL DEFAULT 'text',
      items      TEXT    NOT NULL DEFAULT '[]',
      color      TEXT    NOT NULL DEFAULT 'default',
      pinned     INTEGER NOT NULL DEFAULT 0,
      archived   INTEGER NOT NULL DEFAULT 0,
      labels     TEXT    NOT NULL DEFAULT '[]',
      trashed_at INTEGER,
      position   INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notes_list ON notes (trashed_at, archived, pinned, updated_at);
  `);

  // manual-order column added after the first release; migrate existing databases in place.
  const cols = db.prepare("PRAGMA table_info(notes)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "position")) {
    db.exec("ALTER TABLE notes ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  }

  globalForDb.__noteDb = db;
  return db;
}
