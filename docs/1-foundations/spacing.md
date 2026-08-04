---
type: Foundation
title: Spacing
description: Named --nui-* rem steps for gaps, padding, and layout rhythm.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Spacing

Named spacing steps for layout rhythm.

## Purpose

The `--nui-*` numeric grid defines gaps, padding, margins, and layout rhythm (rem). Typography uses named rem tokens in [[typography]] (`--nui-body`, `--nui-h1`, `--nui-leading-h1`, and so on).

## `--nui-*` grid

Tailwind-aligned rem steps: `--nui-0`, `--nui-px`, `--nui-0-5`, `--nui-1` … `--nui-96`. Full list in `NUI/theme.css` §1 Scale.

| Step | rem | Typical spacing use |
| ---- | --- | ------------------- |
| **0** | **0** | Headings + bases embeds — `--heading-spacing` / `--n-bases-embed-padding-block` |
| 2 | 0.5rem | Tight inset (graph frame) |
| 3 | 0.75rem | Backlink row padding |
| **4** | **1rem** | Body block gap (`--p-spacing`) |
| 6 | 1.5rem | Double step-3 gutter |
| 8 | 2rem | Folder chip column gap |
| 24 | 6rem | Fixed-width UI (timeline search) |

Typography line boxes and block spacing both use numeric `--nui-N` steps where noted in the theme; font sizes are rem literals in [[typography]], not derived from the spacing grid.

## Usage

```css
--p-spacing: var(--nui-4);
--heading-spacing: var(--nui-0);
--n-bases-embed-padding-block: var(--nui-0);
/* List: Folders — row-gap: var(--nui-4); column-gap: var(--nui-8) */
```

Block stack rhythm in notes: one empty line between block elements in source (paragraphs, embeds, headings, lists, tables). Headings and bases embeds add no extra vertical padding — blank lines in source own the gap.

## Status

| Implementation | Notes |
| ---------------- | ----- |
| Obsidian theme | shipped — §1 Scale |
| Obsidian plugin | direct `--nui-*` in styles.css |
