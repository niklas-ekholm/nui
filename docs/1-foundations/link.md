---
type: Foundation
title: Link
description: Link appearance in body copy versus UI chrome.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Link

Link appearance in body copy vs UI chrome.

## Purpose

Link tokens distinguish readable body links from chrome controls that navigate without underline.

## Tokens

### Body links

Underlined; use **content** colour. Resolved and unresolved states may differ subtly.

### Chrome links

Embed titles and toolbar text act as links on click but use **no underline** — colour and cursor only.

## CSS

Canonical reference (NUI Theme §5):

```css
/* Body — resolved wikilinks use --link-color / underline */
/* Unresolved — dashed underline, 1px */
/* Chrome — .view-header, .bases-toolbar, table headers: no underline */
```

Obsidian variable map: see [[nui-theme]] §5.

## Status

| Implementation | Notes |
| ---------------- | ----- |
| Obsidian theme | shipped — §5 theme.css |
| Obsidian plugin | embed titles in View Header |


## Roadmap

- None

