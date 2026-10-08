import { NextRequest, NextResponse } from "next/server";
import { deleteNote, updateNote } from "@/lib/notes";
import { NotePatch } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = NotePatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const note = updateNote(id, parsed.data);
  return note ? NextResponse.json(note) : NextResponse.json({ error: "not found" }, { status: 404 });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return deleteNote(id) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "not found" }, { status: 404 });
}
