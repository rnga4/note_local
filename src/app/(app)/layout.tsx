import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";

// the auth gate reads the session cookie, so it must run per request
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!(await isAuthed())) redirect("/login");
  return children;
}
