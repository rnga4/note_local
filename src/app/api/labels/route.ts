import { NextResponse } from "next/server";
import { listLabels, trashCount } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ labels: listLabels(), trashedCount: trashCount() });
}
