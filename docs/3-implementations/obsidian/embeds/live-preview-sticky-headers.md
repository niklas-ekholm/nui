---
type: Implementation
title: Live Preview Sticky Headers
description: Keeping full timeline and month tracker headers fixed under pane chrome while the note scrolls.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Live Preview Sticky Headers

Live Preview — embedded full timeline and month tracker headers stick under pane chrome while the note scrolls on `.cm-scroller`.

## Purpose

In a markdown note (Live Preview), a **full** timeline or month embed should keep its header band fixed under Obsidian’s tab row and note header, with chart content scrolling underneath. The band must stay opaque so grid lines, bars, and titles do not show through the **time axis** row.

This is separate from [[2-elements/embed-chrome/index|Embed Chrome]] (hover-revealed Bases toolbar inside the embed).

## Terms

| Term | Meaning |
| ---- | ------- |
| **Pane chrome** | Tab strip (`.workspace-tab-header-container`) plus note header (`.view-header` / breadcrumbs). |
| **Sticky header** | Timeline: `.nui-timeline-sticky-header` — topbar + **time axis row**. Month: `.nui-month-tracker-header`. |
| **Time axis row** | `.nui-timeline-axis-row` — month band, primary scale (week numbers / dates), optional weekday row. See [[axis]]. |
| **Effective pane chrome bottom** | Viewport Y of the lower edge of pane chrome (header bottom includes cover `translateY` when present). |

## DOM (full timeline)

```
.nui-timeline
  .nui-timeline-sticky-header     ← sticky in LP
    .nui-timeline-topbar
    .nui-timeline-axis-row        ← time axis (not inside .nui-timeline-chart)
  .nui-timeline-scroll
    .nui-timeline-chart
      .nui-timeline-body         ← grid, rows, events
```

Vertical scroll for embedded **full** / **full-tasks** timelines uses the note’s `.cm-scroller`, not an inner `.nui-timeline-scroll` overflow (LP rules set `overflow: visible` on the embed chain).

## Stick line

Module: `src/embed/embed-chrome-stick-line.ts` (registered from `main.ts`).

On each LP `.cm-scroller`, the plugin sets:

| Variable | Meaning |
| -------- | ------- |
| `--nui-chrome-stick-top` | Sticky `top` offset: effective pane chrome bottom minus scroller top, minus editor gutter padding (see below). |
| `--nui-cm-scroller-pad-top` | Top padding on the scroller (or `.cm-sizer` fallback), excluding cover scroll band when `data-nui-has-cover`. |
| `--nui-cm-scroller-pad-inline-start` / `-end` | Horizontal scroller padding used for breakout. |

Pane chrome bottom is `max(tab strip bottom, view header bottom)`. Promoted cover headers (`.nui-cover-promoted-header`) are included via `getBoundingClientRect()`. `note-cover-image.ts` calls `updateChromeStickTop` after header layout so embed sticky stays aligned while breadcrumbs move.

## Scroller padding breakout

Obsidian / theme padding on `.cm-scroller` insets embed content. Sticky headers use negative horizontal margins and widened `width` so the mat spans the scroller; `padding-inline-start: var(--nui-cm-scroller-pad-inline-start, 32px)` restores alignment with body text.

Vertical sticky uses:

```css
top: calc(var(--nui-chrome-stick-top, 0px) - var(--nui-cm-scroller-pad-top, 0px));
```

**CSS:** `styles.css` — LP rules for `.nui-timeline-sticky-header` and `.nui-month-tracker-header`.

## Timeline time axis height

Axis height tokens (`--nui-main-axis-height`, `--nui-weekday-axis-height`, `--nui-axis-height`) must live on **`.nui-timeline`**, not only on `.nui-timeline-chart`, because the axis row sits in the sticky header (sibling of `.nui-timeline-scroll`).

`syncTimelineAxis` → `setAxisHeights()` in `src/core/timeline/timeline-axis.ts` writes vars on the timeline root. Defaults are on `.nui-timeline` in `styles.css`; `.nui-timeline-axis-row` uses `min-height: var(--nui-axis-height)`.

If vars were chart-only, the axis row collapsed to ~4px (padding only) and the opaque mat did not cover the scale.

## Layering and opaque mat

Chart content is a **later DOM sibling** of the sticky header; with LP `overflow: visible`, bars and grid can paint over the axis unless stacked correctly.

| Layer | Rule |
| ----- | ---- |
| Sticky header | `z-index: 20`, `isolation: isolate`, `--n-surface` on wrapper and `::before` backdrop |
| `.nui-timeline-scroll` | `z-index: 0` |
| Time axis row | Full height + surface; no separate reparent above the embed |

Do not reintroduce cm-line reparenting for sticky; LP uses CSS sticky inside the embed plus overflow/`contain: none` on embed blocks for full timeline / month.

## Month tracker

Compact month header (`.nui-month-tracker-header`) uses the same `--nui-chrome-stick-top` and scroller padding breakout in LP. Grid layout for year + weekdays is unchanged; stick behaviour matches timeline.

## Related code

| Area | Path |
| ---- | ---- |
| Stick line sync | `src/embed/embed-chrome-stick-line.ts` |
| Cover + stick refresh | `src/editor/note-cover-image.ts` |
| Timeline DOM | `src/core/timeline/render-timeline.ts` |
| Axis ticks + height vars | `src/core/timeline/timeline-axis.ts` |
| LP overflow / sticky CSS | `styles.css` (~timeline LP embed block, sticky header, axis row) |

## Related docs

- [[note-header-layout]] — LP scroller and header grid (distinct from embed sticky)
- [[3-implementations/obsidian/embeds/index|Embeds]] — `|wide`, full height pipes
- [[axis]] — time axis rows and grid
- [[2-elements/timeline/implementation|Implementation]]

## Roadmap

- Bases tab / Reading view parity audit if sticky rules differ from LP embed
