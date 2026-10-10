"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export function ShareForm({ title, text, url }: { title: string; text: string; url: string }) {
  const initialTitle = title || (url ? url.replace(/^https?:\/\//, "").slice(0, 60) : "");
  const initialContent = [text, url].filter(Boolean).join("\n");
  const [t, setT] = useState(initialTitle);
  const [c, setC] = useState(initialContent);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.create({
        title: t.trim(),
        content: c,
        type: "text",
        items: [],
        images: [],
        color: "default",
        pinned: false,
        archived: false,
        labels: [],
      });
      window.location.href = "/";
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="nb w-full max-w-xl p-4">
      <h1 className="mb-1 text-lg font-black tracking-tight">Save shared content</h1>
      <p className="mb-3 text-sm text-[var(--muted)]">It becomes a new note.</p>
      <input
        autoFocus
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="Title"
        aria-label="Title"
        className="mb-2 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold placeholder:text-[var(--muted)]"
      />
      <textarea
        value={c}
        onChange={(e) => setC(e.target.value)}
        rows={6}
        placeholder="Content"
        aria-label="Content"
        className="w-full resize-none border-2 border-[var(--border)] bg-[var(--surface)] p-3 text-sm placeholder:text-[var(--muted)]"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="min-h-11 px-3 text-sm font-bold text-[var(--text)] underline decoration-2 underline-offset-4 hover:bg-[var(--hover)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy || (!t.trim() && !c.trim())}
          className="nb-btn min-h-11 bg-[var(--accent)] px-4 text-sm font-bold text-[var(--accent-ink)]"
        >
          {busy ? "Saving..." : "Save note"}
        </button>
      </div>
    </div>
  );
}
