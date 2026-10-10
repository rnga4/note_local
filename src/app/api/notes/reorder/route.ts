import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { ReorderInput } from "@/lib/types";
import { reorderNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const parsed = ReorderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ reordered: reorderNotes(parsed.data.ids) });
}
