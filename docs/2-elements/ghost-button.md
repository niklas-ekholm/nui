---
type: Element
title: Ghost Button
description: Text-only toolbar control with no fill — Today, timespan trigger, restore.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Ghost Button

Text-only toolbar control — **Today**, timespan menu trigger, restore **⤶**. Create actions use [[add-button]].

## Purpose

Ghost Button element — label-only control with no fill; core interactive chrome building block.

## Uses foundations

- [[ghost-chrome]]
- [[two-tier-text]]
- [[typography]] — **small** UI size

## Appearance

Plain label at **small** size; **ui** colour. No border, background, or shadow. On hover: **content** colour (unless pinned to **chrome** — see [[add-button]]).

## Implementation (Obsidian)

Ghost controls must not use native `<button>` styling. Obsidian applies filled backgrounds and `box-shadow` to `button:not(.clickable-icon)` — that reads as an unintended border.

Prefer `<span role="button">` for label-only controls (**Today**, [[add-button]]). If `<button>` is required, add class `clickable-icon` or fully reset `background`, `border`, and `box-shadow` on all states (`:hover`, `:focus-visible`, `:active`) inside `.nui-text-scope`.

## States

| State | Appearance |
| ----- | ---------- |
| Default | Muted label |
| Hover | Content colour |
| Hidden | Not rendered (view-specific) |

## Used in

- [[2-elements/timeline/index|Timeline]]
- [[2-elements/tracker/index|Tracker]]
- [[2-elements/list/index|List]]
- [[2-elements/embed-chrome/index|Embed Chrome]]

## Roadmap

- None

