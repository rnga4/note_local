"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const THEME_EVENT = "themechange";

type Skin = "nb" | "material" | "ios";
type Mode = "light" | "dark";

const SKINS: { id: Skin; label: string; hint: string }[] = [
  { id: "nb", label: "Neobrutalism", hint: "Ink borders, hard shadows" },
  { id: "material", label: "Modern", hint: "Soft, rounded, minimal" },
  { id: "ios", label: "iOS", hint: "System blue look" },
];

const CURRENT: { skin: Skin; mode: Mode } = { skin: "nb", mode: "light" };

function init() {
  const el = document.documentElement;
  CURRENT.mode = el.classList.contains("dark") ? "dark" : "light";
  CURRENT.skin = el.classList.contains("skin-material")
    ? "material"
    : el.classList.contains("skin-ios")
    ? "ios"
    : "nb";
}

function apply(skin: Skin, mode: Mode, el: HTMLElement) {
  CURRENT.skin = skin;
  CURRENT.mode = mode;
  el.classList.toggle("dark", mode === "dark");
  el.classList.toggle("skin-material", skin === "material");
  el.classList.toggle("skin-ios", skin === "ios");
  try {
    localStorage.setItem("theme", mode);
    localStorage.setItem("skin", skin);
  } catch {
    /* storage can be blocked; the classes still apply for this session */
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getSkin = () => CURRENT.skin;
const getMode = () => CURRENT.mode;

if (typeof document !== "undefined") init();

const THEME_COLOR = {
  nb: { light: "#ffe600", dark: "#0e0e0e" },
  material: { light: "#6750a4", dark: "#141218" },
  ios: { light: "#f2f2f7", dark: "#000000" },
} as const;

export function ThemeMenu({ className = "" }: { className?: string }) {
  const skin = useSyncExternalStore(subscribe, getSkin, () => "nb" as Skin);
  const mode = useSyncExternalStore(subscribe, getMode, () => "light" as Mode);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const color = THEME_COLOR[skin][mode];
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [skin, mode]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: Skin | Mode, what: "skin" | "mode") => {
    const el = document.documentElement;
    apply(what === "skin" ? (next as Skin) : CURRENT.skin, what === "mode" ? (next as Mode) : CURRENT.mode, el);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const skinLabel = SKINS.find((s) => s.id === skin)?.label ?? "Neobrutalism";

  const opt = (active: boolean) =>
    `flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-bold ${
      active ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--text)] hover:bg-[var(--hover)]"
    }`;

  return (
    <div ref={rootRef} className={`mt-3 ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="nb-btn min-h-11 w-full px-3 text-left text-sm font-bold text-[var(--text)]"
      >
        {`Appearance · ${skinLabel} · ${mode === "dark" ? "Dark" : "Light"}`}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <div role="radiogroup" aria-label="Theme" className="flex flex-col gap-1">
            {SKINS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={skin === s.id}
                onClick={() => pick(s.id, "skin")}
                title={s.hint}
                className={opt(skin === s.id)}
              >
                <span className={`h-3 w-3 shrink-0 rounded-full ${skin === s.id ? "bg-[var(--bg)]" : "bg-[var(--accent)]"}`} />
                {s.label}
              </button>
            ))}
          </div>

          <div role="radiogroup" aria-label="Mode" className="flex flex-col gap-1">
            {(["light", "dark"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => pick(m, "mode")}
                className={opt(mode === m)}
              >
                <span
                  className={`ink h-3 w-3 shrink-0 rounded-full ${
                    mode === m ? "bg-[var(--bg)]" : m === "dark" ? "bg-[var(--text)]" : "bg-[var(--surface)]"
                  }`}
                />
                {m === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}