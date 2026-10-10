"use client";
import { useSyncExternalStore } from "react";

const THEME_EVENT = "themechange";

const isDark = () => document.documentElement.classList.contains("dark");

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage can be blocked; the class still applies for this session */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`min-h-11 rounded px-3 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] ${className}`}
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
