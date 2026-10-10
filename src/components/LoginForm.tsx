"use client";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password. Try again.");
        setPassword("");
        setBusy(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="nb w-full max-w-sm p-5">
      <h1 className="mb-1 text-lg font-black tracking-tight">Notes</h1>
      <p className="mb-4 text-sm text-[var(--muted)]">Enter your password to continue.</p>
      <label htmlFor="password" className="mb-1 block text-xs font-bold text-[var(--muted)]">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="nb min-h-11 w-full px-3 text-sm"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-[var(--muted)]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !password}
        className="nb-btn mt-4 min-h-11 w-full bg-[var(--accent)] px-4 text-sm font-bold text-[var(--accent-ink)]"
      >
        {busy ? "Checking..." : "Unlock"}
      </button>
    </form>
  );
}
