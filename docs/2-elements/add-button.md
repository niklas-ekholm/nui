---
type: Element
title: Add Button
description: The + create control at the far right of a view header topbar.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Add Button

**+** — the primary create control at the far right of a [[2-elements/view-header/index|View Header]] topbar.

## Purpose

Add Button element — one-tap create affordance for the host layout. Action is view-specific; glyph and placement are not.

## Uses foundations

- [[ghost-chrome]]
- [[typography]] — note text scale

## Appearance

Literal **+** at note text scale (`--font-text-size`) — larger than **small** toolbar [[ghost-button]] controls in the control cluster. Closer to Obsidian’s default add affordance than the compact toolbar scale.

**Chrome** colour at rest and on hover — pinned; does not promote to **content** on hover like neighbouring ghost controls. No border, background, or shadow.

Vertically aligned with the title row. Last in the control row — same gap as other elements; see [[topbar-layout]].

## Placement

```
┌────────────────────────────────────────────────────┐
│ [Title]     [filter] [dates] [controls…] [+]       │
└────────────────────────────────────────────────────┘
```

Direct child of the control row (`nui-timeline-header` on [[2-elements/timeline/index|Timeline]]; `nui-bases-view-topbar` on Week ×3 [[2-elements/tracker/index|Tracker]] and [[2-elements/list/index|List]] embeds).

## Implementation (Obsidian)

`<span role="button">` with text **+** — not native `<button>`. Classes: `.nui-timeline-add-btn`, `.nui-week-tracker-3-add`. Full ghost chrome reset on all states inside `.nui-text-scope`. Excluded from `.nui-text-scope` content-colour hover overrides so **chrome** persists on hover.

Some list layouts use [[icon-button]] with a plus icon in [[2-elements/embed-chrome/index|Embed Chrome]] instead of this text glyph — same create role, different presentation. List and Navigation views use this text **+** in `nui-bases-view-topbar`.

## States

| State | Appearance |
| ----- | ---------- |
| Default | **+** in **chrome** |
| Hover | **Chrome** (unchanged) |

## Behaviour by layout

| Layout | Action |
| ------ | ------ |
| [[2-elements/timeline/index|Timeline]] | New note in hosting `.base` folder |
| [[2-elements/tracker/index|Tracker]] Week ×3 | New habit bundle — see [[habit-create]] |
| [[2-elements/list/index|List]] Folders | New subfolder + index note |
| [[2-elements/list/index|List]] Navigation | New subfolder + index note |
| [[2-elements/list/index|List]] Files | New note in host folder (when wired) |

## Used in

- [[2-elements/timeline/index|Timeline]]
- [[2-elements/tracker/index|Tracker]]
- [[2-elements/list/index|List]]
- [[2-elements/embed-chrome/index|Embed Chrome]]
- [[2-elements/view-header/index|View Header]]

## Roadmap

- Unify text **+** and icon-plus embed toolbar into one implementation pattern

