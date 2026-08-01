# 1 Foundations

Platform-agnostic definitions — token families and cross-element behaviour rules. All notes live flat in this folder.

## In this section

- [[accessibility|Accessibility]] — Contrast, touch-target, and motion baselines every element and implementation must meet.
- [[border|Border]] — Border treatments — hairline, bottom rule, pill outline — and where each is used.
- [[color|Color]] — Four-token semantic palette plus the host-provided accent.
- [[drag-to-edit|Drag to Edit]] — Direct-manipulation pattern: scrub labels, drag bars, resize handles instead of modal dialogs.
- [[full-bleed|Full Bleed]] — When a data view may break out of the readable column to the editor pane edge.
- [[ghost-chrome|Ghost Chrome]] — Toolbar and chart controls carry no fill; hover and active states change colour only.
- [[layout|Layout]] — Grid, base unit, readable column, and embed breakout rules.
- [[link|Link]] — Link appearance in body copy versus UI chrome.
- [[motion|Motion]] — Minimal motion — hover-reveal fades and instant control feedback, no decorative animation.
- [[pan-and-zoom|Pan and Zoom]] — Space-drag pan, scroll pan, and modifier-wheel or pinch zoom on chart views.
- [[progressive-disclosure|Progressive Disclosure]] — Embed chrome stays hidden until the pointer enters the embed region.
- [[scope-boundary|Scope Boundary]] — A root inside which component tokens override host chrome, letting notes and data views share one tree.
- [[scope-isolation|Scope Isolation]] — A component subtree using its own token set inside a scope root.
- [[spacing|Spacing]] — Named --nui-* rem steps for gaps, padding, and layout rhythm.
- [[text-roles|Text Roles]] — Named text roles — body, heading, label, and the rest — mapped to type sizes and colour tokens.
- [[two-tier-text|Two-Tier Text]] — Content colour for readable emphasis, ui colour for muted chrome at rest.
- [[typography|Typography]] — Rem-based type scale where weight compensates for size to keep typographic colour even.

## Purpose

Foundations define *how things look and behave* before you pick an [[2-elements/index|element]]. Token notes hold definitions and reference CSS. Notes tagged `#designpattern` hold behaviour rules used across elements.

| Kind | Tag | Examples |
| ---- | --- | -------- |
| Token / definition | _(none)_ | [[typography]], [[color]], [[spacing]], [[layout]], [[border]], [[link]], [[motion]], [[scope-boundary]], [[accessibility]] |
| Design pattern | `#designpattern` | [[ghost-chrome]], [[two-tier-text]], [[progressive-disclosure]], [[full-bleed]], [[pan-and-zoom]], [[scope-isolation]], [[drag-to-edit]] |

Platform CSS mapping for Obsidian: [[nui-theme]].

## Roadmap

- Map spacing tokens to px in [[spacing]] ↔ `theme.css` / `styles.css`
- Expand [[layout]] and [[accessibility]] from stubs
