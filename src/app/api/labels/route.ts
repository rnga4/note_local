import { NextRequest, NextResponse } from "next/server";
import { deleteLabel, listLabels, purgeTrash, renameLabel, retentionDays, trashCount } from "@/lib/notes";
import { LabelName, LabelRename } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  purgeTrash();
  return NextResponse.json({ labels: listLabels(), trashedCount: trashCount(), retentionDays: retentionDays() });
}

export async function PATCH(req: NextRequest) {
  const parsed = LabelRename.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { from, to } = parsed.data;
  return NextResponse.json({ renamed: renameLabel(from, to) });
}

export async function DELETE(req: NextRequest) {
  const parsed = LabelName.safeParse(req.nextUrl.searchParams.get("name"));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ removed: deleteLabel(parsed.data) });
}
