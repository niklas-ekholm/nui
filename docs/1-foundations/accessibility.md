---
type: Foundation
title: Accessibility
description: Contrast, touch-target, and motion baselines every element and implementation must meet.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Accessibility

Accessibility expectations for NUI — contrast, touch targets, and motion. Carbon accessibility guidelines analog.

## Purpose

Foundations-level rules so elements and implementations meet legibility and operability baselines across platforms.

## Tokens

| Concern | Rule |
| ------- | ---- |
| Contrast | **content** on **surface** must meet WCAG AA for body text; **ui** may be lower contrast for chrome only |
| Touch targets | Interactive controls ≥ 44×44px on touch where feasible |
| Motion | Respect `prefers-reduced-motion`; no decorative animation |
| Colour alone | State must not rely on colour only — use position, weight, or outline |

## CSS

Not yet centralized in theme.css. Per-element fixes (e.g. Timeline mobile tap targets) live in plugin `styles.css`. See [[mobile]].

## Status

| Implementation | Notes |
| ---------------- | ----- |
| Obsidian theme | partial — two-tier text aids contrast |
| Obsidian plugin | touch target enlargement on Timeline mobile |


## Roadmap

- Audit contrast for light and dark four-token palette
- Document reduced-motion behaviour for embed chrome fade-in

