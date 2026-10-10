import type { Note } from "./types";

export type Op =
  | { k: "upsert"; note: Note }
  | { k: "remove"; id: string }
  | { k: "emptyTrash" };

const QUEUE_KEY = "note-queue";
const CACHE_PREFIX = "note-cache:";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage can be full or blocked; the in-memory state still works
  }
}

export function getQueue(): Op[] {
  const raw = safeGet(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Op[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setQueue(queue: Op[]) {
  safeSet(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(op: Op): number {
  const queue = getQueue();
  queue.push(op);
  setQueue(queue);
  return queue.length;
}

export function pendingCount(): number {
  return getQueue().length;
}

// Cached list payloads drop image data so a big attachment cannot blow the
// localStorage quota; offline you still see titles and text.
export function cacheList(key: string, notes: Note[]) {
  safeSet(CACHE_PREFIX + "list:" + key, JSON.stringify(notes.map((n) => ({ ...n, images: [] }))));
}

export function cachedList(key: string): Note[] | null {
  const raw = safeGet(CACHE_PREFIX + "list:" + key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Note[];
  } catch {
    return null;
  }
}

export function cacheMeta(meta: { labels: string[]; trashedCount: number; retentionDays: number }) {
  safeSet(CACHE_PREFIX + "meta", JSON.stringify(meta));
}

export function cachedMeta(): { labels: string[]; trashedCount: number; retentionDays: number } | null {
  const raw = safeGet(CACHE_PREFIX + "meta");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { labels: string[]; trashedCount: number; retentionDays: number };
  } catch {
    return null;
  }
}
