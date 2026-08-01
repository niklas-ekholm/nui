---
type: Element
title: Collapse Chevron
description: One fold control for every expandable subtree — folder trees, heading folds, timeline rows.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Collapse Chevron

Fold control for expandable sections — same glyph and hitbox everywhere Obsidian (or NUI) collapses a subtree.

## Purpose

Collapse Chevron element — one consistent disclosure affordance for folder trees, heading folds, and timeline superproject rows. Reuse Obsidian’s native `collapse-icon` pattern instead of custom triangles or sizes that inherit from local typography.

## Uses foundations

- [[progressive-disclosure]]

## Appearance

| Property | Value |
| -------- | ----- |
| Icon | Obsidian `right-triangle` |
| Glyph size | `10px × 10px` |
| Stroke | `4px` |
| Hitbox | `var(--size-4-5)` (`20px`) |
| Margin | `var(--size-2-1)` to the right of the glyph |

**Orientation** — the icon points **down** at rest (expanded). When collapsed, `.is-collapsed` rotates it **right** in LTR:

```
transform: rotate(calc(var(--direction, 1) * -1 * 90deg));
```

Do not invert this logic: `right-triangle` defaults to down, not right.

**Scale** — chevron size is fixed in pixels and Obsidian size tokens. It must **not** follow parent `font-size` (for example timeline bar title row size **XS**–**XL**).

## States

| State | Chevron | Class |
| ----- | ------- | ----- |
| Expanded | Points down | `collapse-icon` |
| Collapsed | Points right (LTR) | `collapse-icon is-collapsed` |

## Used in

- Obsidian file explorer — folder expand/collapse
- Obsidian editor — heading and list fold indicators (same visual weight)
- [[2-elements/timeline/index|Timeline]] — superproject rows with subprojects (bar title, left of label)

## Implementation (Obsidian)

**Host UI** — file explorer and heading folds use Obsidian’s built-in `collapse-icon` / `collapse-indicator` markup. NUI does not restyle those sizes; they are the reference.

**Timeline superproject toggle** — NUI Plugin renders:

- Classes: `tree-item-icon collapse-icon nui-timeline-superproject-toggle`
- Icon: `setIcon(…, "right-triangle")`
- Toggle class `is-collapsed` when subprojects are hidden

CSS in plugin `styles.css` (`.nui-timeline-superproject-toggle.collapse-icon`) mirrors Obsidian `app.css` collapse-icon sizing and rotation. Code: `src/core/timeline/render-timeline.ts`.

Clicking the chevron collapses or expands subproject rows only; clicking the bar title still opens the note.

## Roadmap

- None
