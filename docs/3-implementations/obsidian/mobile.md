---
type: Implementation
title: Mobile
description: Touch-specific overrides — grid sizing, embed margins, and the sync workflow.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Mobile

NUI on Obsidian Mobile — sync, touch behaviour, and embed layout fixes.
## Purpose

Touch-specific overrides for NUI layouts — rolling week grid, year tracker grid, embed margin fixes, and folder-link chips. Desktop behaviour stays in element notes; this doc covers deltas only.

Plugin and theme files live in `.obsidian/` inside the vault and sync via iCloud. Build `main.js` on the Mac (`cd plugin && npm run build`, or `npm run dev` with the vault path set via `NUI_VAULT_PLUGIN_DIR`), wait for sync, then reload the plugin on iPhone (Settings → Community plugins, or restart Obsidian).

`manifest.json` sets `isDesktopOnly: false`. Editor commands that need a hardware keyboard are gated behind `Platform.isDesktopApp` and are not registered on mobile.

## Note header

Inline title and in-document properties use NUI Theme §4b. Desktop and tablet share the same 50/50 header row; phone stacks title above properties.

| Device | Layout |
| ------ | ------ |
| Desktop | Title left, properties right |
| Tablet (`body.is-mobile.is-tablet`) | Same as desktop |
| Phone (`body.is-phone`) | Title full width, properties below |

**CSS:** `.obsidian/themes/NUI/theme.css` — §4b responsive rules after the base grid block. See [[note-header-layout]].

## Bases embed margins (touch)

Obsidian expands embedded Bases blocks past the readable text column on touch devices (`--bases-embed-width`, `--bases-embed-transform`). That produces uneven left/right margins when combined with NUI layout.

NUI cancels full-bleed sizing inside `@media (hover: none)` for embeds that contain:

- [[habit-year-tracker]] — `.nui-year-tracker`
- [[weekly-habits]] — `.nui-week-tracker-3`
- [[2-elements/list/index|List]] **Folders** — `.nui-cards--list-folders`

The fix resets embed width/transform, keeps `width` / `max-width: 100%`, zero margin/padding on the embed wrapper, and sets `overflow: visible` and `contain: none` so tracker day rings are not clipped at the right edge.

Do **not** add symmetric `padding-inline` on the embed wrapper to “align” with body text — it stacks on Obsidian’s breakout transform and makes the right margin much larger than the left.

**CSS:** `.obsidian/plugins/nui/styles.css` — search for `cancel Obsidian full-bleed sizing on touch`.

## Timeline

On touch (`Platform.isMobile`):

- Chart background drag pans the date range (no space key).
- Pinch zoom on the chart.
- Larger tap targets on header controls and bar handles.
- Container class `nui-timeline--mobile`.

See [[2-elements/timeline/index|Timeline]] and `src/core/timeline/timeline-viewport.ts`.

## Week Tracker

| Platform | Grid |
| -------- | ---- |
| Desktop | Three week blocks (two past + current); 7 columns per block |
| Mobile (`Platform.isMobile`) | Single rolling row of **10 days** ending today; today is the **rightmost** column |

Mobile adds classes `nui-week-tracker-3--rolling` and CSS variable `--n-week-tracker-rolling-days: 10`.

Day cells stay **22×22px** (`--n-tracker-day-size`) with **11px** labels — same as desktop. Tracker containers use `overflow: visible` so the today ring on the last column is not clipped.

**Code:** `src/core/week-tracker-3/week-grid.ts`, `src/views/week-tracker-3-bases-view.ts`, `src/core/week-tracker-3/render-week-tracker-3.ts`.

## Year Tracker

| Platform | Month grid | Day cells |
| -------- | ---------- | --------- |
| Desktop | 4 columns × 3 rows | 22×22px (`--n-tracker-day-size`) |
| Touch (`@media (hover: none)`) | 3 columns × 4 rows | 18×18px (`--n-year-tracker-day-size`) |

Touch sets `--n-year-tracker-month-columns: 3` in `styles.css`. Week rows use the same scoped day size for row height — do not set row tracks smaller than cells.

### Hairlines above/below the day grid (touch)

After the full-bleed cancel, two layout issues can show as 1px horizontal rules at the top and bottom of each month’s day grid:

1. **Embed outline** — NUI Theme sets `--bases-cards-shadow: 0 0 0 1px` on all `.nui-text-scope` Bases embeds. Inside the readable column that shadow reads as hairlines along the content edges. Year tracker clears it: `--bases-embed-border-width: 0`, `--bases-cards-shadow: none`, `box-shadow: none` on `:is(.bases-embed, .bases-view):has(.nui-year-tracker)`.
2. **Stretched week rows** — The shared tracker container used `height: 100%` with stretch alignment. On touch the day grid grew taller than its six week rows; default `align-content: stretch` expanded the rows and left empty bands above the first week and below the last. Fix: `height: auto`, `align-content: start` on the year tracker container, month grid, and `.nui-year-tracker-days`.

Do **not** tighten week spacing by shrinking row tracks below cell size or with negative margins on day cells — that overflows the grid box and brings the artifacts back.

**CSS:** `.nui-year-tracker`, `.nui-year-tracker-days`, `.nui-tracker-bases-container:has(.nui-year-tracker)` in `styles.css`. **Code:** `src/views/year-tracker-bases-view.ts`, `src/core/year-tracker/render-year-tracker.ts`.

## List: Folders

Folder links use a **flex-wrap chip** layout (not a fixed-width card grid):

- Each link is only as wide as its title + arrow.
- Links flow left-to-right and wrap to new rows.
- Spacing: `row-gap: var(--nui-4)`, `column-gap: var(--nui-8)`.
- Long names ellipsize at the container edge on narrow screens.

On touch, the same embed margin fix as the week tracker applies.

**List: Files** is unchanged — still a multi-column grid with two-line title clamp.

**CSS:** `.nui-cards--list-folders` in `styles.css`. **Code:** `src/cards/render-cards.ts`, `src/views/card-list-bases-views.ts`.


## Roadmap

- Re-check mobile parity when new desktop layouts ship

