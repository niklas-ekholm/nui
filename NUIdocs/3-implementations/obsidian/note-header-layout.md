---
type: Implementation
title: Note Header Layout
description: Live Preview note header — inline title left, properties right, body full width.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Note Header Layout

Live Preview — inline title left, in-document properties right, body full width below.

## Purpose

Default note header layout in NUI Theme §4b:

| Region | Layout |
| ------ | ------ |
| Inline title | Left half of the header row |
| Properties (`metadata-container`) | Right half of the header row |
| Body (`.cm-content` / `.cm-contentContainer`) | Full readable column width on the row below |

Obsidian setting **Show inline title** must be on (`showInlineTitle` in `app.json`).

## DOM (Live Preview)

When properties are shown in the note, Obsidian often places the inline title and metadata as **direct children of `.cm-sizer`**, not only inside `.mod-header.mod-ui`. NUI therefore applies the same two-column grid to:

- `.mod-header.mod-ui` (when it wraps title + properties), and
- `.cm-sizer` (when title + properties are direct sizer children).

Body blocks (`.cm-content`, `.cm-contentContainer`, preview sections) span **`grid-column: 1 / -1`** on row 2 so only the header row is split 50/50 — not the body text.

**CSS:** `.obsidian/themes/NUI/theme.css` — section **§4b Properties**.

Gap below the header row uses `--n-inline-title-margin-bottom` (default `0.9em`). Body block spacing follows Obsidian defaults (`--p-spacing`, `--heading-spacing`) with one empty line between block elements in source — see [[spacing]].

## Responsive

| Device | Header layout |
| ------ | ------------- |
| Desktop | Title left, properties right (50/50 grid) |
| Tablet | Same as desktop |
| Phone | Title full width, properties below |

Phone uses a single-column grid on the same §4b hosts (`.mod-header.mod-ui`, `.cm-sizer`, and sizer-level fallbacks when metadata is a sibling of `.mod-header`). Tablet re-asserts the two-column grid so touch devices do not fall back to accidental stacking. Details and DOM variants: [[mobile]].

## Short-note vertical jump (fixed)

### Symptom

On notes shorter than roughly one pane of body lines (~14 lines at default 16px text), deleting a line from the bottom caused the **first body line** (and `.cm-contentContainer`) to **move down** one step per deleted line. Behaviour did not appear in vanilla Obsidian with the default theme.

### Causes

Two separate NUI rules interacted with Obsidian’s **`min-height: 100%`** on `.cm-sizer` and scroll-padding logic on `.cm-content`:

1. **Theme — grid row stretch** (`theme.css` §4b)  
   `.cm-sizer` is a CSS grid with a header row (title | properties) and a body row. Without **`align-content: start`**, the default `align-content: stretch` expands grid rows to fill the sizer’s min-height. As body content shrinks, the **header row grows** and pushes row 2 (body) downward.

2. **Plugin — global size container** (`styles.css`)  
   `container-type: size` on **every** `.cm-scroller` / `.view-content` (originally for full-bleed timeline embeds) interfered with Obsidian’s height math for scroll-past-end padding on short notes.

### Fixes (do not revert)

| Fix | File | Rule |
| --- | ---- | ---- |
| Pin grid rows to the top | `theme.css` §4b | `align-content: start` on the title/properties grid |
| Pin body to row 2 | `theme.css` §4b | `grid-row: 2; align-self: start` on sizer children that are not title/metadata |
| Scope container query | `styles.css` | `container-type: size` only on `.view-content:has(.nui-timeline--full, .nui-timeline--full-tasks)` |

Do **not** “fix” short notes by zeroing `.cm-content` padding with `!important` — remove the NUI layout hooks above instead.

### Verify

1. Open a note with properties and fewer than ~14 body lines.
2. Scroll to the top; delete lines from the bottom.
3. First body line and header→body gap should stay fixed.
4. In DevTools, `.cm-contentContainer` should not step downward; grid row 1 height should not grow when body shrinks.

## Related

- [[nui-theme]] — §4b header/properties layout
- [[spacing]] — `--nui-4` block stack step
- [[nui-plugin]] — timeline full-bleed container query only
- [[mobile]] — similar `align-content: start` pattern for year tracker week rows on touch

## Roadmap

- Document reading-view-only DOM variants if Obsidian moves title/properties entirely into `.mod-header`

