# DESIGN.md

Direction for note.local. Authored by the project owner on 2026-10-08 (direction answer: "Tenang & monokrom, dials 1/1/1"; language answer: "English"). This file is design data: identity, personality, palette, typography, mood, dials.

## Identity

A local-only notes app for one person, running on their own machine. No marketing surface, no signup, no brand campaign. The product is the list of notes and nothing else.

## Personality

Quiet, utilitarian, out of the way. It should feel like a tool that is already open, not a product announcing itself. Nothing shouts, nothing floats, nothing glows.

## Mood

Calm. Neutral. Settled.

## Palette

Monochrome only for the app chrome.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#fafafa` | `#0a0a0a` | page background |
| `--surface` | `#ffffff` | `#171717` | composer, cards, panel |
| `--surface-2` | `#f5f5f5` | `#262626` | inputs, hover fills |
| `--text` | `#171717` | `#f5f5f5` | primary text |
| `--muted` | `#525252` | `#a3a3a3` | secondary text, placeholders (>= 4.5:1 on both surfaces) |
| `--border` | `#d4d4d4` | `#404040` | dividers |
| `--border-strong` | `#737373` | `#737373` | input boundaries (>= 3:1 non-text) |

No accent hue. The accent is contrast itself: the near-white/near-black end of the ramp is spent only on the active nav item and the focus ring, so those two moments are the loudest thing on screen.

Note colors are user content, not chrome. They stay as a color-coding feature, tinted to the theme: light tints on a light page, dark tints on a dark page. They are data the user picks, so they are exempt from the monochrome chrome rule.

## Typography

The system font stack (no web font). Reason: a local tool should render instantly with zero network cost and match the OS the owner already reads all day. No monospace display type, no uppercase labels with wide tracking; hierarchy comes from weight and size only.

## Theme

Both light and dark ship and both must work. The toggle is real, the choice persists, and there is no default forced by markup.

## Language

English for every visible string, `lang="en"` to match.

## Dials

`Dial: ENERGY 1 / RHYTHM 1 / MOTION 2`

- **ENERGY 1**: the interface says hello once, quietly. No hero, no oversized type, no decorative gestures.
- **RHYTHM 1**: sections are uniform on purpose. Composer, then one grid, then the same grid under each heading. Variation is not the goal here; predictability is.
- **MOTION 2**: enter transitions only: one shot, 150ms, one easing, no loops, no scroll reveals, no parallax. Four moments move, each for a reason: a note card rises 4px and fades in so a new or freshly filtered note shows where it landed; the editor scrim fades in and the panel rises 4px so the dialog reads as lifted from the card it came from; the mobile menu drops in 4px so opening the disclosure is visible; colors cross-fade 150ms so a theme or note-color change is a blend, not a cut. `prefers-reduced-motion` disables all of it. The original direction answer was MOTION 1 (hover only); the owner raised it the same day, on 2026-10-08, asking for transitions that feel smooth.

## Identity motif

Flat hairline surfaces: every surface is a solid fill with a 1px border, no shadow, no blur, no radius larger than a small rounded corner. Hierarchy comes from weight and from one inverted element (the Save button), never from decoration. The motif repeats on the composer, every card, every input, and the editor panel, so the app is recognizable as itself with the product name removed.


## Decision log (one line per decision, R-31)

- Monochrome chrome: the owner chose calm and monochrome, so color is reserved for user note content.
- Amber accent removed: it was an unreasoned default, and it fought the monochrome direction.
- System font stack: zero load cost, matches the OS, fits a local tool.
- Sidebar is a plain text list, not a rounded pill row: the pill row is Google Keep's signature (R-30), and the owner did not ask for a clone.
- Masonry columns for notes: notes differ in height, so equal-height rows would waste space (content-driven, R-05).
- Sidebar becomes a disclosure panel below 768px: a phone has no room for a permanent rail, and hiding navigation outright excluded mobile users (R-03).
- All targets at 44px: thumb-sized input is the mobile floor, not a preference (R-03).
- Icon approach: no icon library, no emoji. Five literal line marks (pin, box, bin, undo, close) drawn inline for the five actions that need one; everything else is a text label. Relevance: each mark depicts its action (R-04).
- Focus ring is a 2px outline in the text color with an offset: it survives every surface in both themes and clears 3:1 (R-32).
- Loading, error, and three distinct empty states: a data view that only knows the happy path is unfinished (R-27).
- Theme persisted in `localStorage` and applied before paint: no flash of the wrong theme (R-34).
- No shadows and no blur anywhere: elevation is carried by the modal scrim alone, which keeps the flat hairline motif intact (R-12, R-10).
- The Save button is the only inverted element on screen: the single deliberate accent, spent once (Part 3, one deliberate accent).
- MOTION dial raised 1 → 2: the owner asked for animations that feel smooth; every moving element has a written purpose, runs once, and dies under prefers-reduced-motion (R-19).
- One duration and one easing for all motion: 150ms, `cubic-bezier(0.4, 0, 0.2, 1)`: uniform motion fits RHYTHM 1; choreography does not.
- Enter only, no exit: exits would need per-component unmount animation code for a feeling the app does not need; the cross-fade covers the rest (R-19).
- Empty trash needs a second tap: one click permanently deletes rows in a local no-backup app, so the first tap only arms a "Confirm empty trash?" that cools off after a few seconds.
- Composer draft autosaves to localStorage: switching views, a refresh, or a closed tab no longer eats a half-typed note; Save or Cancel clears it.
- Focus returns to the control that opened a dialog or the mobile menu: closing lands keyboard focus back where it started (R-32).
- Download backup: a quiet link that streams every note as JSON with a dated filename; a local-only app should make getting data out as easy as putting it in.
- The Trash item shows its count ("Trash (n)") so you know what is waiting before opening the view.
- Optimistic edits roll back if the save fails: the list does not keep showing a PATCH that never landed.
