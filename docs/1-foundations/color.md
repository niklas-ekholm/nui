---
type: Foundation
title: Color
description: Four-token semantic palette plus the host-provided accent.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Color

Four-token palette plus host-provided accent.

## Purpose

Colour tokens apply everywhere — notes, chrome, and custom views. Semantic names are platform-agnostic.

## Tokens

| Token | Role |
| ----- | ---- |
| **surface** | Flat background everywhere |
| **content** | Body text, headings, bar labels, primary readable copy |
| **ui** | Muted chrome — toolbar labels, axis ticks, metadata |
| **border** | Hairlines, grid lines, input underlines |

### Accent

Accent is not part of the four-token set. It comes from the host (**Settings → Appearance → Accent colour** in Obsidian). Use for selection, today markers, and interactive emphasis — not for default chrome.

### Usage

| Need | Token |
| ---- | ----- |
| Note body, bar title | content |
| Toolbar control at rest | ui |
| Toolbar control on hover | content |
| Grid line, underline | border |
| Selected bar, today line | accent |

Light and dark modes each define the four tokens. Surfaces stay flat; only values change.

## CSS

Canonical reference (NUI Theme §0):

```css
.theme-light {
	--n-surface: #fdfdfd;
	--nui-content: #000;
	--nui-chrome: #aaa;
	--n-border: #aaa;
}
.theme-dark {
	--n-surface: #000;
	--nui-content: #aaa;
	--nui-chrome: #445;
	--n-border: #445;
}
```

§2 maps these to Obsidian `--color-base-*` aliases. Obsidian variable map: see [[nui-theme]].

## Status

| Implementation | Notes |
| ---------------- | ----- |
| Obsidian theme | shipped — §0–§2 theme.css |
| Obsidian plugin | no palette hex in styles.css |


## Roadmap

- None

