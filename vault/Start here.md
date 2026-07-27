---
date: 2026-07-27
---

# NUI — example vault

This vault exists to show what the NUI plugin and theme do. Every note in it is
invented. Poke at anything.

> [!warning] This vault is opinionated on purpose
> The settings here are not NUI's defaults. Folder-index navigation is **on**,
> which changes what clicking a folder in the sidebar does: it opens that
> folder's own note instead of expanding it. Habits, dates, and cover images
> follow specific conventions, described below. If you install NUI into a vault
> of your own, everything starts off until you turn it on.

## Where to look first

| Open this | To see |
| --- | --- |
| [[Contents.base]] | Navigation, folder and file lists, and today's daily note — five views |
| [[Tracker.base\|Habits/Tracker.base]] | The three habit trackers: three-week, year, and month |
| [[Timeline.base\|Bases/Timeline.base]] | Projects as bars on a date axis, in three layouts |
| [[Gallery.base\|Bases/Gallery.base]] | The picture gallery and both card sizes |
| [[Tasks.base\|Bases/Tasks.base]] | Checkbox tasks pulled out of the project notes |
| [[Scores.base\|Bases/Scores.base]] | A numeric property charted over time, as a line and as bars |

Between them those cover all fourteen views the plugin adds. Each base has a
view picker in its top-right corner — most of them hold more than one view.

## The conventions this vault uses

These are the parts you would have to match in your own vault for the views to
find anything.

**Dates** live in a `date` property, `YYYY-MM-DD`. A view can be pointed at a
different property, and falls back to an ISO date at the start of the filename.

**Habits are folders.** `Habits/` holds one folder per habit — Reading, Running,
Writing — and each dated note inside a habit folder is one completion. A
`rating` from 1 to 5 shades the cell. The three-week tracker reads the habit
folders sitting beside the base file, which is why `Tracker.base` lives in
`Habits/` rather than in `Bases/`.

**Projects** carry `start`, `end`, and `project`. The timeline groups bars by
`project`, so `Meridian` gathers four notes under one heading and `Kettle`
gathers two. Checkbox lines in the note body feed the task views.

**Cover images** go in a `coverimage` property as a link — `"[[quiet-machines.png]]"`.
The same property drives the card grids and the image at the top of the note
itself.

**Scores** are a `score` number. The chart in `Scores.base` reads the distance
recorded on each run.

## What is missing on purpose

There is no `workspace.json`, so Obsidian opens with its own default layout
rather than one saved on someone else's monitor. Set the panes up however you
like — the vault will remember it from then on, and git ignores it.
