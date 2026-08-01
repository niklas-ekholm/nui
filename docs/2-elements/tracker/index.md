# Tracker

Habit and calendar grids — a year or month for one folder, or three weeks across many.

## In this section

- [[2-elements/tracker/data|Data]] — Options for the year and week x3 tracker views, and the habit bundle they read.
- [[day-cell|Day Cell]] — A single day in the grid — click to open or create the day log; today and completed states.
- [[grid-layout|Grid Layout]] — Grid structure for the year, month, and week variants on desktop and touch.
- [[2-elements/tracker/implementation|Implementation]] — Bases view type ids for the year, month, and week trackers.
- [[month|Month]] — The month variant — a continuous week grid with either day marks or event pills.
- [[2-elements/tracker/toolbar|Toolbar]] — The + button on embedded Week x3, which creates a whole habit bundle.

## Purpose

Day, month, and week tracking views — year-at-a-glance, cross-habit month calendar, and multi-habit weekly boards. Rows and scope come from the folder tree, never from tags. Vault recipes: [[habit-year-tracker]], [[month-calendar]], [[weekly-habits]].

## Appearance

**Year** — 4 months wide × 3 months tall grid. Each day represented by one date number. Each month marked only as a number. On touch: 3 × 4 month grid and slightly smaller day cells — see [[mobile#Year Tracker]].

**Month** — one continuous run of week rows, with either day marks or named event pills per day. See [[month|Month]].

**Week ×3** — habit column left; three week blocks (two past, current); cells per day per habit. On mobile, the 21 days of three weeks is too wide, so we opt for one rolling 10-day row per habit — see [[mobile]].

## Chrome

| Layout | [[add-button]] |
| ------ | -------------- |
| Year | None |
| Month | None |
| Week ×3 | Creates a habit folder and its `index.md` — [[habit-create]] |

## States

| State | Appearance |
| ----- | ---------- |
| Today | Ring on cell |
| Done | Filled cell |
| Empty day | Click opens or creates the day log note (year and week grids) |
| Day with entries | Event pills naming each entry's folder (month, events layout) |

## Examples

- Daily habit logging — year grid per habit.
- Cross-habit month calendar — event pills titled by folder.
- Weekly overview — three-week multi-habit board.
- Vault recipes: [[weekly-habits]], [[habit-year-tracker]], [[month-calendar]].

## Roadmap

- Day-cell interaction detail

# Elements

* [Data](data.md) - Options for the year and week x3 tracker views, and the habit bundle they read.
* [Implementation](implementation.md) - Bases view type ids for the year, month, and week trackers.
* [Toolbar](toolbar.md) - The + button on embedded Week x3, which creates a whole habit bundle.
