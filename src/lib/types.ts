import { z } from "zod";

export const COLORS = ["default", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"] as const;

export const ChecklistItem = z.object({
  id: z.string().max(64),
  text: z.string().max(1000),
  done: z.boolean(),
});

export const NoteInput = z.object({
  title: z.string().max(200).default(""),
  content: z.string().max(100_000).default(""),
  type: z.enum(["text", "list"]).default("text"),
  items: z.array(ChecklistItem).max(500).default([]),
  color: z.enum(COLORS).default("default"),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  labels: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export const NotePatch = NoteInput.partial().extend({ trashed: z.boolean().optional() });
export const ViewSchema = z.enum(["notes", "archive", "trash"]);

export type NoteInput = z.infer<typeof NoteInput>;
export type NotePatch = z.infer<typeof NotePatch>;
export type View = z.infer<typeof ViewSchema>;
export type Note = NoteInput & {
  id: string;
  trashedAt: number | null;
  createdAt: number;
  updatedAt: number;
};
