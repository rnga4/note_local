import type { Note } from "./types";

type Item = Note["items"][number];

// crypto.randomUUID() undefined di http non-localhost (akses LAN) -> pakai ini di client
export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const toItems = (text: string): Item[] =>
  text.split("\n").map((s) => s.trim()).filter(Boolean).map((t) => ({ id: uid(), text: t, done: false }));

export const toText = (items: Item[]): string => items.map((i) => i.text).join("\n");
