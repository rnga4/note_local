"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronRightIcon } from "./icons";

export type MenuAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  checked?: boolean;
  checkRole?: "radio" | "checkbox";
  disabled?: boolean;
  separatorBefore?: boolean;
  submenu?: MenuAction[];
};

type Props = {
  x: number;
  y: number;
  items: MenuAction[];
  label: string;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
};

const ITEM =
  "flex w-full min-h-11 items-center gap-3 px-3 text-left text-sm font-bold text-[var(--text)] " +
  "hover:bg-[var(--hover)] focus:bg-[var(--hover)] focus:outline-none disabled:opacity-40 disabled:hover:bg-transparent";

const PANEL = "nb py-1";

function role(item: MenuAction) {
  if (item.checkRole === "radio") return "menuitemradio";
  if (item.checkRole === "checkbox") return "menuitemcheckbox";
  return "menuitem";
}

export function ContextMenu({ x, y, items, label, onClose, returnFocusTo }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wantSubFocus = useRef(false);
  const [pos, setPos] = useState({ x, y });
  const [sub, setSub] = useState<string | null>(null);
  const [subLeft, setSubLeft] = useState(false);
  const [closing, setClosing] = useState(false);

  onCloseRef.current = onClose;

  // Keep the panel inside the viewport, and pick the submenu side that has room.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    const left = Math.max(pad, Math.min(x, window.innerWidth - r.width - pad));
    const top = Math.max(pad, Math.min(y, window.innerHeight - r.height - pad));
    setPos({ x: left, y: top });
    setSubLeft(left + r.width + 224 > window.innerWidth);
  }, [x, y]);

  const close = useCallback(() => setClosing(true), []);

  // Give the panel its exit before unmounting (MOTION 3).
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => onCloseRef.current(), 120);
    return () => window.clearTimeout(t);
  }, [closing]);

  // Focus the first item so the keyboard works the moment the menu opens.
  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
  }, []);

  // After opening a submenu by keyboard, move focus into it.
  useEffect(() => {
    if (sub && wantSubFocus.current) {
      wantSubFocus.current = false;
      subRef.current?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
    }
  }, [sub]);

  // Any click outside, scroll, resize, or focus loss dismisses the menu.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const dismiss = () => close();
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [close]);

  const onKeyDown = (e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement | null;
    const scope = active?.closest<HTMLElement>('[role="menu"]') ?? null;
    if (!active || !scope) return;
    const nodes = Array.from(scope.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)'));
    const i = nodes.indexOf(active);

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (sub) {
        setSub(null);
        scope.querySelector<HTMLElement>('button[data-sub]')?.focus();
      } else {
        returnFocusTo?.focus();
        close();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(i + 1) % nodes.length]?.focus();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      nodes[0]?.focus();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      nodes[nodes.length - 1]?.focus();
      return;
    }
    if (e.key === "ArrowRight") {
      const key = active.dataset.sub;
      if (key) {
        e.preventDefault();
        wantSubFocus.current = true;
        setSub(key);
      }
      return;
    }
    if (e.key === "ArrowLeft" && scope !== rootRef.current) {
      e.preventDefault();
      setSub(null);
      scope.parentElement?.querySelector<HTMLElement>('button[data-sub]')?.focus();
    }
  };

  const rows = (list: MenuAction[]) =>
    list.map((item) => {
      const sep = item.separatorBefore ? <div role="separator" className="ink-t my-1" /> : null;
      if (item.submenu) {
        const open = sub === item.key;
        return (
          <div key={item.key} role="none" onMouseEnter={() => setSub(item.key)}>
            {sep}
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={open}
              data-sub={item.key}
              disabled={item.disabled}
              className={ITEM}
              onClick={() => {
                wantSubFocus.current = true;
                setSub(open ? null : item.key);
              }}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            {open && (
              <div
                ref={subRef}
                role="menu"
                aria-label={item.label}
                style={{ maxHeight: "min(70vh, 24rem)" }}
                className={`absolute top-0 max-w-64 overflow-y-auto ${subLeft ? "right-full" : "left-full"} ${PANEL} ${
                  closing ? "exit-fade" : "enter-drop"
                }`}
              >
                <div className="min-w-44">{rows(item.submenu)}</div>
              </div>
            )}
          </div>
        );
      }
      return (
        <div key={item.key} role="none" onMouseEnter={() => setSub(null)}>
          {sep}
          <button
            type="button"
            role={role(item)}
            aria-checked={item.checkRole ? Boolean(item.checked) : undefined}
            disabled={item.disabled}
            className={ITEM}
            onClick={() => {
              item.onSelect?.();
              close();
            }}
          >
            {item.checkRole ? (
              <span className="grid h-[18px] w-[18px] place-items-center">
                {item.checked && <CheckIcon className="h-[18px] w-[18px]" />}
              </span>
            ) : (
              item.icon
            )}
            <span className="flex-1">{item.label}</span>
          </button>
        </div>
      );
    });

  return createPortal(
    <div
      ref={rootRef}
      role="menu"
      aria-label={label}
      style={{ left: pos.x, top: pos.y }}
      onKeyDown={onKeyDown}
      className={`fixed z-50 min-w-52 max-w-64 ${PANEL} ${closing ? "exit-fade pointer-events-none" : "enter-drop"}`}
    >
      {rows(items)}
    </div>,
    document.body,
  );
}
