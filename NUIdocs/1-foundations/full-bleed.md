---
type: Foundation
title: Full Bleed
description: When a data view may break out of the readable column to the editor pane edge.
tags: [designpattern]
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Full Bleed

#designpattern

Data view extends to the **editor pane edge** instead of staying in the readable column — e.g. `![[Timeline.base|wide]]` or `![[photo.png|wide]]`.

On touch, Obsidian also applies full-bleed sizing to Bases embeds. NUI overrides this for some views — see [[mobile]].

## Purpose

Cross-element behaviour definition — when a view may break out of the note column.

## Rule

Use the embed pipe **`|wide`** for pane breakout. CSS resolves width against the outermost editor container (`.view-content` / `.cm-scroller`), not the prose column — so sidebars are respected. Timeline **height** is separate: `|compact` (480px scroll), `|full-tasks`, or embedded default (auto height). On touch, cancel breakout where it breaks margin balance.

## Used by

- [[Plan]] (full-width dashboard embeds)
- [[mobile]] embed margin fixes


## Roadmap

- None
