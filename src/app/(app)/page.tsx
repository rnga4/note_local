import { authEnabled } from "@/lib/auth";
import { NotesApp } from "@/components/NotesApp";

export default function Page() {
  return <NotesApp authEnabled={authEnabled()} />;
}
