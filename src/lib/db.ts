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

  // External-content FTS index so search ranks phrases instead of scanning LIKE.
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title, content, items, content='notes', content_rowid='rowid'
    );
    CREATE TRIGGER IF NOT EXISTS notes_fts_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, content, items) VALUES (new.rowid, new.title, new.content, new.items);
    END;
    CREATE TRIGGER IF NOT EXISTS notes_fts_ad AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, content, items) VALUES ('delete', old.rowid, old.title, old.content, old.items);
    END;
    CREATE TRIGGER IF NOT EXISTS notes_fts_au AFTER UPDATE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, content, items) VALUES ('delete', old.rowid, old.title, old.content, old.items);
      INSERT INTO notes_fts(rowid, title, content, items) VALUES (new.rowid, new.title, new.content, new.items);
    END;
  `);
  // repopulate from the source table so rows that predate the index are searchable
  db.exec("INSERT INTO notes_fts(notes_fts) VALUES ('rebuild')");

  globalForDb.__noteDb = db;
  return db;
}
