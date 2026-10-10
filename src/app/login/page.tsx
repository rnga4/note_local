import { redirect } from "next/navigation";
import { authEnabled, isAuthed } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

// redirect depends on the session cookie, so evaluate it per request
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!authEnabled() || (await isAuthed())) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <LoginForm />
    </main>
  );
}
