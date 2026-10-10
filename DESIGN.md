# DESIGN.md

Direction for note.local. Re-authored by the project owner on 2026-10-10, replacing the calm monochrome direction with **neobrutalism** (accent: electric yellow; type: system stack, heavy). This file is design data: identity, personality, palette, typography, mood, dials.

## Identity

A local-only notes app for one person, running on their own machine. No marketing surface, no signup, no brand campaign. The product is the list of notes and nothing else. The look is loud on purpose: it is the owner's own tool, so it is allowed a personality the owner actually likes.

## Personality

Blunt, high-contrast, physical. Every surface reads like a printed block: a thick ink outline and a hard offset shadow, as if the pieces were pressed onto paper. Nothing is soft, nothing floats, nothing glows.

## Mood

Bold. Direct. A little playful.

## Palette

Two neutrals plus one accent. Black (or white in dark) is the ink: it draws every border and every shadow.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#fffdf5` | `#0e0e0e` | warm paper page |
| `--surface` | `#ffffff` | `#1a1a1a` | composer, cards, panel |
| `--surface-2` | `#f3edda` | `#262626` | hover and input fills |
| `--text` | `#000000` | `#ffffff` | primary text and the ink |
| `--muted` | `#4b4b4b` | `#b5b5b5` | secondary text (>= 4.5:1 on both surfaces) |
| `--border` | `#000000` | `#ffffff` | every 2px outline |
| `--shadow` | `#000000` | `#ffffff` | hard offset shadow color |
| `--accent` | `#ffe600` | `#ffe600` | the single accent, electric yellow |

The accent is spent at one key moment: the primary Save button. Active navigation is an ink block (inverted text), not the accent, so yellow stays rare and keeps its power. Note colors remain user content and are restyled as flat tinted blocks under the same ink border.

## Typography

The system font stack, pushed to heavy weights. Reason: a local tool should render instantly with zero network cost, and the neobrutalist character comes from weight, the ink border, and the hard shadow, not from a display face. Headings and the wordmark run black (800 to 900); body stays regular; nothing is uppercase with wide tracking.

## Theme

Both light and dark ship and both must work. Dark is the same idea inverted: white ink on near-black paper. The toggle is real, the choice persists, and there is no default forced by markup.

## Language

English for every visible string, `lang="en"` to match.

## Dials

`Dial: ENERGY 3 / RHYTHM 2 / MOTION 2`

- **ENERGY 3**: the interface says hello hard. Thick outlines, hard shadows, one electric accent, weight everywhere. It is a tool the owner chose to make loud.
- **RHYTHM 2**: the notes grid stays a predictable masonry, but the headings and the states break it. Uniformity where scanning matters, a break where a section starts.
- **MOTION 2**: one-shot enter transitions (150ms, one easing) plus a physical press on buttons. Purposes: a new or freshly filtered note rises 4px so it shows where it landed; the editor scrim fades and the panel rises so the dialog reads as lifted from the card it came from; the mobile menu drops 4px so opening the disclosure is visible; a button shifts 3px into its shadow on press so the click feels physical. `prefers-reduced-motion` disables all of it.

## Identity motif

The ink block: a 2px solid border plus a hard offset shadow (`4px 4px 0`, never blurred) on a flat fill with square corners. Pressing a control moves it into its shadow. The motif repeats on the composer, every card, every input, the editor panel, and every button, so the app is recognizable as itself with the product name removed.

## Decision log (one line per decision, R-31)

- Neobrutalism chosen by the owner on 2026-10-10: it replaces the calm monochrome direction with energy 3, ink borders, and hard shadows.
- Accent is electric yellow `#ffe600`, spent once on the Save button: one deliberate accent, and black text on it clears 16:1.
- Ink border and shadow follow the text color (black in light, white in dark): one token pair keeps both themes coherent and the motif identical.
- Square corners everywhere, circles only for note color swatches: the hard edge is the style, and a swatch must still read as color, not chrome.
- System stack at heavy weights: zero load cost fits a local tool; the character is carried by weight and ink, not a web font.
- Active nav is an ink block (inverted text): it marks the current view without spending the accent.
- Card action buttons stay plain, with no border or shadow: a dense toolbar of outlined boxes would out-shout the cards themselves.
- Note colors stay user content, restyled as flat tinted blocks under the same ink border: the user's color lives inside the motif instead of fighting it.
- Focus ring is a 3px ink outline with offset: it stays visible on every surface in both themes and clears 3:1 (R-32).
- MOTION stays 2 from the owner's earlier request: enter transitions run once, plus a press shift on buttons (R-19).
- Monochrome chrome replaced: color is no longer reserved for note content alone; the accent now carries the primary action.
- Cards and the composer lift 4px, buttons 3px: elevation is the motif, not a soft shadow, so the amount is a fixed offset with a written reason (R-12).
- System font stack kept over a display face: the owner chose the system stack to preserve instant render on a local machine.
- Sidebar is a plain list that inverts on the active item, not a rounded pill row (R-30): a pill row is Google Keep's signature.
- Masonry columns for notes: notes differ in height, so equal-height rows would waste space (content-driven, R-05).
- Sidebar becomes a disclosure panel below 768px: a phone has no room for a permanent rail, and hiding navigation outright excluded mobile users (R-03).
- All targets at 44px: thumb-sized input is the mobile floor, not a preference (R-03).
- Icon approach: no icon library, no emoji. Six literal line marks drawn inline for the actions that need one; everything else is a text label (R-04).
- Loading, error, and several distinct empty states: a data view that only knows the happy path is unfinished (R-27).
- Theme persisted in `localStorage` and applied before paint: no flash of the wrong theme (R-34).
- Empty trash needs a second tap: one click permanently deletes rows in a local no-backup app, so the first tap only arms a "Confirm empty trash?" that cools off after a few seconds.
- Composer draft autosaves to `localStorage`: switching views, a refresh, or a closed tab no longer eats a half-typed note.
- Focus returns to the control that opened a dialog or the mobile menu: closing lands keyboard focus back where it started (R-32).
- Download backup: a quiet link that streams every note as JSON with a dated filename; a local-only app should make getting data out as easy as putting it in.
- Optimistic edits roll back if the save fails: the list does not keep showing a PATCH that never landed.
