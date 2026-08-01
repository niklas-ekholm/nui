---
type: Implementation
title: NUI Theme
description: The Obsidian theme — foundation tokens mapped to CSS variables and native chrome.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# NUI Theme

NUI Theme is the Obsidian theme for NUI. Files live in `.obsidian/themes/NUI` (iCloud-synced).

Load order: theme → plugins → snippets (snippets off).

## Purpose

Maps [[1-foundations/index|1 Foundations]] tokens to Obsidian CSS variables and native chrome. Palette and typography only — layout and custom views live in [[nui-plugin]] `styles.css`.

## Split from NUI Plugin

| Artefact | Responsibility |
| -------- | -------------- |
| **theme.css** | Colour, typography, chrome, links, tables, native Bases UI |
| **styles.css** (NUI Plugin) | Layout and behaviour for custom views |

Plugin **styles.css** carries no palette hex; view colours are in **theme.css** section 10.

## Design (from [[0-philosophy/index|0 Philosophy]])

Flat surfaces; two-tier text; ghost chrome; accent from **Settings → Appearance → Accent colour**.

Private — not for the Obsidian theme store. This vault only.

## Token map

| NUI token | Obsidian CSS variable |
| --------- | --------------------- |
| surface | `--n-surface` |
| content | `--nui-content` |
| ui | `--nui-chrome` |
| border | `--n-border` / `--nui-border-color` |
| accent | `--n-accent` (from host accent HSL) |

## Section map (theme.css)

| Section | NUI area |
| ------- | -------- |
| §0–§9 | [[1-foundations/index|1 Foundations]] — note chrome, headings, links, tables (see [[table-column-layout]] for plugin layout) |
| §1a Spacing | Numeric `--nui-*` spacing from [[spacing]] |
| §1b Typography scale | Rem type ladder from [[typography]] — **edit values here** |
| §1c Typography | Element rules wired from §1b |
| §4b | In-document properties + note header grid — see [[note-header-layout]] |
| §10 | NUI Plugin scope — `.nui-text-scope`, timeline, tracker, cards |

## See also

- Layout, behaviour, and custom Bases views are owned by [[nui-plugin]]; the theme must not implement those.

## Roadmap

- None

