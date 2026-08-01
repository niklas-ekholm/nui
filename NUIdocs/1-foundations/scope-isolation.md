---
type: Foundation
title: Scope Isolation
description: A component subtree using its own token set inside a scope root.
tags: [designpattern]
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Scope Isolation

#designpattern

Component subtree uses its own token set inside a scope root (`.nui-text-scope` in Obsidian).

## Purpose

Cross-element behaviour definition — plugin views inherit theme tokens through a scoped root without leaking palette into layout CSS.

## Rule

Custom views render inside a text-scope root. Theme maps **content** and **ui** inside that scope; plugin `styles.css` carries layout only, no palette hex.

Ghost and toolbar controls inside the scope must suppress Obsidian’s default `button` / input chrome (background, border, `box-shadow`, focus ring). Layout CSS should reset these on all interaction states. Colour for those controls comes from theme tokens, not `--interactive-normal`.

## Used by

- All NUI Plugin [[2-elements/index|2 Elements]] in embedded Bases views

## See also

- What a scope boundary *is* is defined in [[scope-boundary]].
- Palette mapping inside the scope root is in [[nui-theme]].

## Roadmap

- None

