---
type: Implementation
title: Table Column Layout
description: Separator-row markers driving shrink-to-content and proportional table columns.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Table Column Layout

GFM pipe tables with column widths driven by the **separator row** — shrink-to-content columns and proportional fill columns. Syntax is valid markdown without NUI Plugin; layout applies when the plugin is enabled.

## Purpose

NUI tables use Pandoc-style separator markers for two jobs at once:

| Job | Where it lives |
| --- | -------------- |
| GFM validity | Separator row (Obsidian / other renderers) |
| Column layout | Same row — parsed by NUI Plugin |

**Shrink** columns hug their content. **Fill** columns share the remaining table width in ratio to their dash count. Alignment follows leading/trailing colons (`:---`, `:---:`, `---:`).

NUI Theme §6 supplies typography and inter-column gutter (`--n-table-column-gap`). NUI Plugin applies `table-layout: fixed`, `<colgroup>` widths, and shrink cell rules.

## Separator syntax

Write layout intent **only in the separator row** — not in header cells.

| Separator cell | Mode | Weight | Notes |
| -------------- | ---- | ------ | ----- |
| `-` | shrink | — | Canonical shrink marker; valid GFM |
| `:-`, `-:`, `:-:` | shrink | — | Shrink + left / right / centre alignment |
| `--`, `---`, `----`, … | fill | = dash count | Share remaining width by ratio |
| `:--`, `:---:`, `---:`, … | fill | = dash count | Fill + alignment |
| `^`, `:^:` | shrink | — | Legacy alias; **invalid GFM** — Obsidian may render as a body row; plugin hides it |

Single `-` = shrink. Two or more `-` = fill with that weight. This differs from Obsidian’s habit of padding every separator cell to `---` or longer when you edit a table.

### Example

From [[Shrubbery Note Wide]]:

```markdown
| A | B | C | D | E | F |
| - | -- | -- | ---: | --- | --- |
| L | … | … | … | … | small |
```

| Column | Layout |
| ------ | ------ |
| A | Shrink (label column) |
| B, C | Fill ×2 each — equal pair |
| D | Fill ×3, right-aligned |
| E, F | Fill ×3 each — equal pair |

Fill weights 2 + 2 + 3 + 3 + 3 = 13 parts of the space **after** column A takes its content width.

## Without NUI Plugin

- Pipe tables still render as normal GFM.
- A single `-` per cell satisfies the spec minimum.
- No shrink/fill layout — columns size by browser defaults.
- Separator dash counts are inert for layout (only alignment colons matter to GFM).

## Obsidian separator padding

Live Preview **auto-pads** separator rows with extra dashes when you edit table cells or switch to source mode. That breaks NUI weight semantics (`-` vs `--` vs `---`).

NUI Plugin blocks this at several layers:

| Layer | When it runs |
| ----- | ------------ |
| CodeMirror `transactionFilter` (`Prec.highest`) | Immediately after Obsidian rewrites a table — reverts separator dash counts before the edit settles |
| CodeMirror `ViewPlugin` fallback | Catches any separator drift after chained transactions |
| `workspace.on("editor-change")` | Re-applies stored separators via the Obsidian Editor API |
| `active-leaf-change` | Re-checks separators when switching notes or editing modes |
| `file-open` / `onLayoutReady` | Seeds per-file canonical separators from disk |

Canonical separators are keyed by **trimmed header cell content** (column count + labels), not the padded header line — so Obsidian header spacing changes do not reset the store.

Direct edits to the separator row only update the stored canonical row (compacted to minimal dashes). All other table edits revert the separator to the stored row.

Cell **spacing** in header/body rows may still be padded by Obsidian — only separator **dash counts** are preserved.

Tables already corrupted on disk (every cell `---`) must be fixed once manually; after that the plugin keeps the restored row.

## DOM and CSS

| Layer | File | Responsibility |
| ----- | ---- | ---------------- |
| Theme | `theme.css` §6 | Header/body type, hairline rules, `--n-table-column-gap`, outer-edge flush on first/last columns |
| Plugin | `styles.css` | `table.nui-table-layout`, `.nui-table-col-shrink`, alignment classes, phantom separator hide |
| Plugin | runtime | `<colgroup>` width percentages; shrink reserves ~1% per shrink column before fill ratios |

Shrink cells: `width: 1%`, `white-space: nowrap`, `box-sizing: border-box`, same half-gap padding as fill columns.

## Code

| Module | Path |
| ------ | ---- |
| Parse separator + tables | `src/editor/table-column-layout/parse-table-layout.ts` |
| Canonical store + fixes | `src/editor/table-column-layout/separator-canonical.ts` |
| Apply colgroup + classes | `src/editor/table-column-layout/apply-table-layout.ts` |
| Preserve separator dashes (CM6) | `src/editor/table-column-layout/preserve-table-separator-rows.ts` |
| Workspace guard (editor-change, mode switch) | `src/editor/table-column-layout/register-separator-guard.ts` |
| Register post-processor + CM6 | `src/editor/table-column-layout/register-table-column-layout.ts` |

Registered from `src/main.ts` via `registerTableColumnLayout`.

## Related

- [[nui-theme]] — §6 table appearance and gutter
- [[nui-plugin]] — editor extensions
- [[2-elements/table/index|Table]] — Obsidian **Bases** table view (separate from markdown pipe tables)
- [[layout]] — readable column and gutter vocabulary

## Roadmap

- Optional per-table opt-out marker (similar to Advanced Tables `-tx-`)
- Document interaction with third-party table formatters if conflicts appear
