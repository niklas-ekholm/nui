---
type: Element
title: Axis
description: Axis rows — week numbers with month name overlay.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Axis

Parent: [[2-elements/timeline/index|Timeline]]

## Rows

| Row | Content |
| --- | ------- |
| Primary | Week numbers; month name overlays week number when they share a day |
| Secondary | Weekday letters (M T W …) at wide zoom only |

The **time axis row** (`.nui-timeline-axis-row`) holds both bands. In full layouts it lives inside `.nui-timeline-sticky-header` so it can stick with the topbar in Live Preview embeds.

## Height tokens

Axis band heights are driven by CSS variables on **`.nui-timeline`** (`--nui-main-axis-height`, `--nui-weekday-axis-height`, `--nui-axis-height`), updated in `timeline-axis.ts`. The row must not take height vars only from `.nui-timeline-chart` — the chart is a sibling below the sticky header.

## Grid

Vertical [[divider]] lines align with day/week boundaries. Labels use metadata role (**ui**, tracked caps).

## Live Preview sticky

When embedded full height in a note, the time axis row stays under pane chrome with an opaque `--n-surface` mat so scrolling grid and bars do not show through. Implementation: [[live-preview-sticky-headers]].

