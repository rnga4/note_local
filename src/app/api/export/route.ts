import { NextResponse } from "next/server";
import { exportAllNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function GET() {
  const notes = exportAllNotes();
  return new NextResponse(
    JSON.stringify({ app: "note.local", exportedAt: new Date().toISOString(), count: notes.length, notes }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="notes-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    },
  );
}