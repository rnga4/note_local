import type { Note } from "./types";

export type Color = Note["color"];

export const noteClass = (c: Color): string => `note note-${c}`;

export const COLOR_DOT: Record<Color, string> = {
  default: "bg-neutral-600",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  teal: "bg-teal-400",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export const COLOR_KEYS = Object.keys(COLOR_DOT) as Color[];
