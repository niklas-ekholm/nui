---
type: Foundation
title: Layout
description: Grid, base unit, readable column, and embed breakout rules.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Layout

Grid, base unit, and readable-column rules for NUI layouts. IBM 2× Grid analog.

## Purpose

Defines how space is divided — readable text column, embed breakout, and spacing multiples — before element-specific layout.

## Tokens

| Token | Role |
| ----- | ---- |
| readable column | Default note body width; embeds may break out per [[full-bleed]] |
| base unit | 8px — suggested step for margins, gutters, and grid alignment |
| row gap | Vertical rhythm between rows in lists and charts |
| gutter | Horizontal gap in multi-column layouts |

## CSS

Canonical reference (NUI Theme §3 workspace, §7 embeds):

```css
/* Flat surfaces — no elevation shadows on workspace chrome */
/* Readable column — tables and images constrained in §6, §7 */
/* Embed breakout — Obsidian --bases-embed-width; NUI cancels on touch per Mobile */
```

Obsidian variable map: see [[nui-theme]] and [[mobile]].

## Status

| Implementation | Notes |
| ---------------- | ----- |
| Obsidian theme | partial — readable column and embed rules in theme.css |
| Obsidian plugin | layout in styles.css per element |


## Roadmap

- Document base-unit px map and column intent for lists/cards
- Align with IBM 2× grid vocabulary without requiring 16-column layouts

