---
type: Element
title: Score Chart
description: Line or bar chart of a numeric score property over time, with an optional reference line.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Score Chart

Plots a numeric `score` property across dated notes. Registered but **not yet used by any `.base` in the vault**.

## Purpose

Score Chart element — the only NUI view that plots a continuous value rather than presence or duration. Where [[2-elements/tracker/index|Tracker]] answers *did it happen* and [[2-elements/timeline/index|Timeline]] answers *how long*, this answers *how much*.

## Uses foundations

- [[ghost-chrome]] — no fill on the chart frame
- [[color]] — **accent** for the series, **ui** for gridlines and axis labels
- [[typography]] — **small** for axis labels
- [[motion]] — instant tooltip, no transition

## Data

One point per entry that has a finite `note.score` **and** a resolvable date. The score property is fixed, not configurable. Dates use the shared fallback order: the view's `dateField`, then `note.date` / `note.Start Date` / `note.startDate` / `note.start`, then the leading `YYYY-MM-DD` of the filename. Points sort by date, then by path.

Entries without a score are skipped rather than plotted as zero.

## Variants

Set by the **view name**, like [[month|Month]]:

| View name | Rendering |
| --------- | --------- |
| `bars` | Vertical bars — `.nui-score-chart-bar` |
| anything else | Polyline with point markers — `.nui-score-chart-line`, `.nui-score-chart-point` |

## Reference line

If the note **hosting the embed** has a `graphLine` number in its frontmatter, a labelled horizontal line is drawn at that value (`.nui-score-chart-custom-line`). It is read from the host note, not from the base, so the same view can carry a different target in each note that embeds it.

```yaml
---
graphLine: 70
---
```

## Chrome

None — no toolbar, and the view clears any mounted Bases title. Host Bases chrome still applies via [[2-elements/embed-chrome/index|Embed Chrome]].

## States

| State | Appearance |
| ----- | ---------- |
| No scored entries | Muted message, `.nui-score-chart-empty` |
| Hover a point | Tooltip with the score |
| Click a point | Opens that note |

## Implementation

| Menu name | Type id |
| --------- | ------- |
| Score Chart | `nui-score-chart` |

**Code:** `src/views/score-chart-bases-view.ts`, `src/core/score-chart/render-score-chart.ts`, `src/bases/score-from-entries.ts`, `src/bases/entry-date.ts`

Rendered as inline SVG, not canvas. See [[nui-plugin]].

## Roadmap

- No base uses it yet — add a recipe under [[3-implementations/obsidian/product/index|Product]] once one does
- Score property is hardcoded to `score`; make it a `scoreField` option if a second use appears
