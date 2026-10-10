import type { ReactNode } from "react";

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function Highlight({ text, query }: { text: string; query?: string }): ReactNode {
  const terms = query?.trim().split(/\s+/).filter(Boolean).map(escape) ?? [];
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-[var(--accent)] text-[var(--accent-ink)]">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
