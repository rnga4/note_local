"use client";
import { useEffect, useState } from "react";
import { CloseIcon } from "./icons";

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  className?: string;
};

export function Toast({ message, actionLabel, onAction, onDismiss, className = "bottom-4" }: Props) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onDismiss, 160);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`fixed left-1/2 z-[60] -translate-x-1/2 ${className}`}>
      <div
        role="status"
        className={`nb ${leaving ? "exit-sheet" : "enter-sheet"} flex items-center gap-2 px-3 py-2`}
      >
        <span className="text-sm">{message}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onAction();
              dismiss();
            }}
            className="nb-btn min-h-9 bg-[var(--accent)] px-3 text-sm font-bold text-[var(--accent-ink)]"
          >
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="grid h-9 w-9 place-items-center text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
