"use client";
import { useEffect } from "react";

export function Pwa() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort; the app still works without it */
    });
  }, []);

  return null;
}
