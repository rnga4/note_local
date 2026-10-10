import { NextRequest, NextResponse } from "next/server";
import { createNote, emptyTrash, listNotes, purgeTrash } from "@/lib/notes";
import { NoteInput, SortSchema, ViewSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const view = ViewSchema.catch("notes").parse(sp.get("view"));
  const sort = SortSchema.catch("updated").parse(sp.get("sort"));
  purgeTrash();
  return NextResponse.json(listNotes(view, sp.get("q") ?? undefined, sp.get("label") ?? undefined, sort));
}

export async function POST(req: NextRequest) {
  const parsed = NoteInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json(createNote(parsed.data), { status: 201 });
}

// DELETE /api/notes -> empty trash
export async function DELETE() {
  return NextResponse.json({ deleted: emptyTrash() });
}
