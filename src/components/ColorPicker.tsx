"use client";
import { COLOR_DOT, COLOR_KEYS, type Color } from "@/lib/colors";

export function ColorPicker({ value, onChange }: { value: Color; onChange: (c: Color) => void }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Note color">
      {COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className="grid h-11 w-11 place-items-center"
        >
          <span
            className={`h-5 w-5 rounded-full ink ${COLOR_DOT[c]} ${
              value === c ? "pop border-[var(--text)] ring-2 ring-[var(--text)]" : ""
            }`}
          />
        </button>
      ))}
    </div>
  );
}
