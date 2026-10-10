import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { ImportPayload } from "@/lib/types";
import { importNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const parsed = ImportPayload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json(importNotes(parsed.data));
}
