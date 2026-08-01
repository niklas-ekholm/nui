---
type: Element
title: Implementation
description: Bases view type ids for the year, month, and week trackers.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Implementation

Parent: [[2-elements/tracker/index|Tracker]]

| Menu name | Type id | Variant |
| --------- | ------- | ------- |
| Year Tracker | `nui-year-tracker` | Year grid |
| Month Tracker | `nui-month-tracker` | [[month|Month]] |
| Week Tracker: 3 | `nui-week-tracker-3` | Week x3 / rolling |

**Code:** `src/views/year-tracker-bases-view.ts`, `src/views/month-tracker-bases-view.ts`, `src/views/week-tracker-3-bases-view.ts`, `src/core/year-tracker/year-grid.ts`, `src/core/month-tracker/month-grid.ts`, `src/core/month-tracker/render-month-tracker.ts`, `src/core/week-tracker-3/week-grid.ts`, `src/bases/tracker-from-entries.ts`

Mobile rolling grid: `Platform.isMobile` in `week-tracker-3-bases-view.ts`. Year tracker touch layout and embed fixes: `@media (hover: none)` in `styles.css`. See [[mobile]].

See [[nui-plugin]].

