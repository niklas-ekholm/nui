---
type: Implementation
title: Nested properties
description: In-document collapsible tree for nested YAML frontmatter in the Properties block.
generated: { by: nui/0.2.2, at: 2026-08-01T00:00:00Z }
---

# Nested properties

Obsidian's built-in Properties UI does not render nested YAML (objects and arrays) as editable fields — it shows an opaque blob. The NUI plugin replaces complex top-level values with a **collapsible tree** inside the in-document `.metadata-container`.

## Enable

**Settings → NUI → Nested properties** (on by default).

Optional: **Collapse nested properties** — new branches start collapsed.

Requires **Properties in document: Visible** (not strict Source mode).

## What it handles

- Top-level object properties (e.g. `generated: { by, at }`)
- Top-level array properties (e.g. `sources: [{ id, resource }]`)
- Nested objects and arrays inside those trees
- Scalar leaves edited via text inputs; changes persist through `processFrontMatter`

## Styling split

| Layer | File | Role |
| --- | --- | --- |
| Plugin | `plugin/styles.css` | Layout, collapse affordances, indent |
| Theme | `theme.css` §4b | Muted keys, monospace scalars/summaries |

Token: `--nui-nested-indent` (default `8px`). Each nesting level indents direct children once; containers do not stack padding.

## Related

- [[note-header-layout]] — title + properties grid (§4b)
- Collapsible properties — fold the entire properties block away

## nui-okf

The same renderer is duplicated in the **nui-okf** plugin for refinery vaults that do not install NUI. When both plugins are active, only one enhancement runs (`data-nui-nested-done` guard).
