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
export const SortSchema = z.enum(["updated", "created", "title", "manual"]);
export const LabelName = z.string().trim().min(1).max(50);
export const LabelRename = z.object({ from: LabelName, to: LabelName });
export const ReorderInput = z.object({ ids: z.array(z.string().min(1).max(64)).max(5000) });

export const ImportedNote = NoteInput.extend({
  id: z.string().min(1).max(64),
  trashedAt: z.number().nullable().optional().default(null),
  position: z.number().optional().default(0),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export const ImportPayload = z.union([
  z.array(ImportedNote).max(5000),
  z.object({ notes: z.array(ImportedNote).max(5000) }).transform((o) => o.notes),
]);

export type NoteInput = z.infer<typeof NoteInput>;
export type NotePatch = z.infer<typeof NotePatch>;
export type View = z.infer<typeof ViewSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type ImportedNote = z.infer<typeof ImportedNote>;
export type Note = NoteInput & {
  id: string;
  trashedAt: number | null;
  position: number;
  createdAt: number;
  updatedAt: number;
};
