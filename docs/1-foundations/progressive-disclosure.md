---
type: Foundation
title: Progressive Disclosure
description: Embed chrome stays hidden until the pointer enters the embed region.
tags: [designpattern]
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Progressive Disclosure

#designpattern

Embed toolbar hidden until pointer enters embed. ~1800ms ease fade-in; pointer-events off while hidden.

## Purpose

Cross-element behaviour definition — keeps embed regions quiet until the user focuses on them.

## Rule

Toolbar and embed chrome stay invisible at rest. On hover over the embed region, chrome fades in over ~1800ms ease. Pointer-events are off while hidden.

## Used by

- [[2-elements/embed-chrome/index|Embed Chrome]]
- [[Plan]]
- [[2-elements/tracker/index|Tracker]]
- [[2-elements/card/index|Card]]


## Roadmap

- None

