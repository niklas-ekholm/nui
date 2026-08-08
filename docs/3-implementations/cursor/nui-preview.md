---
type: Implementation
title: NUI Preview
description: Preview CSS for Cursor — foundation tokens mapped to VS Code markdown preview.
generated: { by: okf-enforcer/0.5, at: 2026-08-08T00:00:00Z }
---

# NUI Preview

`cursor-extension/media/nui-preview.css` styles VS Code's markdown preview (`.markdown-body`). Registered via `markdown.previewStyles` in the extension manifest.

## Purpose

Maps [[1-foundations/index|1 Foundations]] palette and [[typography]] scale to the host preview — reading view only. No layout chrome, no custom views, no Obsidian variable wiring.

Values are copied from [[3-implementations/obsidian/nui-theme|NUI Theme]] `theme.css` §0, §1b, and §1c. When the scale changes in the theme, update this file to match.

## Host integration

| Mechanism | Effect |
| --------- | ------ |
| `markdown.previewStyles` | Injects `nui-preview.css` into every markdown preview webview |
| `html { font-size: 18px }` | Root rem base for the type ladder |
| `body` background/foreground | Uses `var(--vscode-editor-background)` and `var(--vscode-editor-foreground)` so the preview canvas follows the active VS Code theme |
| `.vscode-dark` / `.vscode-high-contrast` | Swaps NUI palette tokens to the dark set (§0 dark values) |

Preview palette tokens (`--n-surface`, `--nui-content`, etc.) are independent of VS Code's UI chrome — only the page background/foreground inherit from the editor theme.

## Token map

| NUI token | CSS variable in preview |
| --------- | ----------------------- |
| surface | `--n-surface` |
| content | `--nui-content` |
| ui / chrome | `--nui-chrome` |
| border | `--n-border` / `--nui-border-color` |

Light defaults: surface `#fdfdfd`, content `#000`, chrome/border `#aaa`. Dark: surface `#000`, content `#aaa`, chrome/border `#445`.

## Typography scale (§1b)

All sizes are rem-relative to the 18px root.

| Role | Size | Leading | Weight | Tracking |
| ---- | ---- | ------- | ------ | -------- |
| body | 1rem | 1.4 | 400 | — |
| code | 0.875rem | 1.2 | 500 | −0.01em |
| h1 | 2rem | 1.1 | 200 | 0 |
| h2 | 1.66rem | 1.1 | 250 | 0.01em |
| h3 | 1.33rem | 1.15 | 300 | 0.005em |
| h4 | 1rem | body | 400 | 0.05em (uppercase) |
| h5 | 0.66rem | 1.2 | 550 | 0.15em (uppercase) |
| h6 | 0.66rem | 1.2 | 350 | 0.15em (uppercase) |
| blockquote | h3 scale | h3 leading | h3 weight | h3 tracking |

Headings use flush vertical rhythm (`--heading-spacing: 0`). Paragraph spacing: `--p-spacing: 1rem`.

## Element rules (§1c subset)

| Element | Rule |
| ------- | ---- |
| **Links** | Content colour; underline thickness 0.06em, offset 0.12em; hover removes underline |
| **Bold** | Weight 600 |
| **Italic** | Normal italic |
| **Code** | Code scale on `code`, `tt`, and `pre code` |
| **Blockquote** | Left rule 1px; h3-scale inner text; 0.75rem indent; thinner link underline inside quotes |

## Layout

`.markdown-body` is centred with `max-width: 700px`, `margin-inline: auto`, and `padding-block: 1.5rem` — a fixed reading column, not full-bleed.

## Split from Obsidian

| Obsidian | Cursor preview |
| -------- | -------------- |
| `theme.css` §0–§9 + §1b/§1c in reading + Live Preview | Preview webview only |
| §4b note header, §10 plugin scope | Not applicable |
| Accent from host appearance | Not wired — links use content colour |

Plugin layout and Bases styling stay in [[3-implementations/obsidian/nui-plugin|NUI Plugin]]; this file must not grow element-view rules.

## See also

- Default preview association and toggle: [[3-implementations/cursor/index|Cursor]] and [[3-implementations/cursor/hotkeys|Hotkeys]].

## Roadmap

- None
