import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`h-[18px] w-[18px] shrink-0 ${className ?? ""}`}
    >
      {children}
    </svg>
  );
}

export function PinIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`h-[18px] w-[18px] shrink-0 ${className ?? ""}`}
    >
      <path d="M7 4h10v5l-2 2v3h-2v6h-2v-6H9v-3L7 9z" />
    </svg>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
      <path d="M5 8.5v11h14v-11" />
      <path d="M10 12.5h4" />
    </Svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v6M13.5 11v6" />
    </Svg>
  );
}

export function RestoreIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 8v4h4" />
    </Svg>
  );
}

export function EditIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20h4L19.5 8.5l-4-4L4 16z" />
      <path d="M14.5 5.5l4 4" />
    </Svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </Svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
      <path d="M3.5 15.5l4.5-4.5 3.5 3.5 3-3 5 5" />
      <circle cx="9" cy="9" r="1.2" />
    </Svg>
  );
}
