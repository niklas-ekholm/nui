---
type: Element
title: Month
description: The month variant — a continuous week grid with either day marks or event pills.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Month

Parent: [[2-elements/tracker/index|Tracker]]

The third tracker variant, alongside Year and Week ×3. Unlike them it can show **what** happened on a day, not just whether it did.

## Scope comes from the view name

`resolveMonthTrackerScope` reads the view name first, so one base serves every span:

| View name | Scope |
| --------- | ----- |
| A 4-digit year — `2026` | That year, all 12 months |
| A month number — `1`–`12` | That month of the current year |
| Anything else — `Calendar`, `compact` | Falls through to the `year` option, then to the year parsed from the host folder path, then to the current year — all 12 months |

Months render as one **continuous** run of week rows from the first day of the earliest month to the last day of the latest (`buildContinuousWeekRows`), not as separate month blocks. A month label marks the row where each month starts.

## Two layouts

Chosen by view name: `compact` gets the mark layout, everything else gets events (`isCompactMonthTrackerView`).

| Layout | Cell contents |
| ------ | ------------- |
| **compact** | A day mark only — same `.nui-tracker-day-mark` as [[day-cell]], `is-done` / `is-today` |
| **events** | Day number plus a stack of event pills, one per note on that day |

An event pill takes its title from the note's **parent folder name** (`eventTitleFromPath`), so a day showing three habits reads as three named pills. Pills sort by title; overflow collapses into a `.nui-month-tracker-event-more` counter. An optional `rating` on the note renders as a dot.

Unlike Year and Week ×3, the events layout keeps **every** note on a date rather than the first one — that is what makes it a cross-habit calendar.

## Data

`entriesToHabitDays` for the compact layout, `entriesToMonthDayEvents` for events. Both filter to the scoped year and take dates from [[2-elements/tracker/data|Data]]'s resolution order.

## Uses foundations

- [[color]] — **accent** for today, **ui** for month labels
- [[border]] — hairline cell grid
- [[typography]] — **small** for day numbers and pill titles

## See also

- Vault recipe: [[month-calendar]]
- Sticky header behaviour in Live Preview: [[live-preview-sticky-headers]]
