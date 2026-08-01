# List

Multi-column list of links — files or folders.

## In this section

- [[2-elements/list/implementation|Implementation]] — Bases view type ids for the list layouts.
- [[row|Row]] — Row chips for files and folders, with titles at the large tier.
- [[2-elements/list/toolbar|Toolbar]] — The + button at the topbar end, creating in the hosting note's folder.

## Purpose

Dense link lists for folder indexes — file grids, date-sorted files, and folder chips.

## Appearance

**Files** — arrow bullet; body-size title; two-line clamp; multi-column grid.

**Folders** — large title; arrow aligned to body size; borderless **chips** that are only as wide as their label. Chips sit in a flex row that wraps — not fixed-width cards. Generous gap between chips (`--nui-4` vertical, `--nui-8` horizontal).

## Chrome

| View | [[add-button]] |
| ---- | -------------- |
| Files | New note in hosting folder |
| Folders | New `Untitled` subfolder + index note |

## Examples

- [[contents]] — **Files**, **Files by Date**, **Folders**, **Recent Files** views.
- [[today-daily-note]] — single folder chip for today's daily note.

## Roadmap

- Multi-column layout detail
- Files vs Folders density comparison

# Elements

* [Implementation](implementation.md) - Bases view type ids for the list layouts.
* [Toolbar](toolbar.md) - The + button at the topbar end, creating in the hosting note's folder.
