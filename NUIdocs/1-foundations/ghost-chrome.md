---
type: Foundation
title: Ghost Chrome
description: Toolbar and chart controls carry no fill; hover and active states change colour only.
tags: [designpattern]
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Ghost Chrome

#designpattern

No filled backgrounds on toolbar and chart controls. Hover and active states change colour only: **ui** → **content**.

## Purpose

Cross-element behaviour definition — how interactive chrome responds without filled backgrounds.

## Rule

Controls have no fill at rest. Hover and active states change text colour from **ui** to **content** only — never add borders, outlines, or elevation shadows.

Inside `.nui-text-scope`, override Obsidian host form chrome (`button` backgrounds, `box-shadow`, `focus-visible` rings) so ghost controls stay label-only. See [[ghost-button]].

## Used by

- [[ghost-button]]
- [[add-button]]
- [[2-elements/embed-chrome/index|Embed Chrome]]
- [[2-elements/view-header/index|View Header]]


## Roadmap

- None

