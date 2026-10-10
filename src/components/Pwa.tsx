"use client";
import { useEffect, useState } from "react";

export function Pwa() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort; the app still works without it */
    });
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="border-b-2 border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-center text-sm font-bold text-[var(--accent-ink)]"
    >
      You are offline. The last loaded page still opens, but changes cannot be saved.
    </div>
  );
}
