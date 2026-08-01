---
type: Principle
title: Speculative Documentation
description: "Spec-first notes that describe what will be built, marked so they are never read as a record of shipped code."
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Speculative Documentation

Most of NUIdocs is written after the fact: the code exists, the note describes it. A **speculative** note inverts that. It is written first, as the design, and the code is built to match it.

## Purpose

Design in prose before code, without ever letting an unbuilt spec be mistaken for a description of what ships. Both kinds of note are written in the same flat, present-tense spec voice — that is deliberate, because a spec hedged into "would" and "should eventually" is not buildable — so the distinction cannot come from tone. It has to be a marker.

## The default is descriptive

Every note in NUIdocs is descriptive unless marked otherwise. A reader who sees no marker may treat the note as a claim about code that exists, and may cite it. That is the promise the marker protects.

## Marking a note

Three marks, all required. Any note carrying one carries all three.

**1. Frontmatter.** `status: speculative`, below `type`. `type` keeps its layer meaning (`Principle`, `Foundation`, `Element`, `Implementation`) so layer filters still work; `status` is a separate axis.

**2. A banner** directly under the H1, before the opening blurb:

```markdown
---
type: Element
status: speculative
title: Command Palette
description: "Fuzzy command launcher over vault actions. Speculative — not built."
timestamp: 2026-07-25T00:00:00Z
---

# Command Palette

> [!warning] Speculative — not built.
> This note is the design, written to be built against. Nothing here describes shipped code.

Fuzzy launcher over every registered vault action…
```

**3. The description ends with `Speculative — not built.`** Folder `index.md` listings copy the description verbatim (see [[ai/index|N-docs]]), so this is what carries the marker into every listing the note appears in — no second rule to keep in sync.

## Marking a section

A shipped note may carry a speculative section — a planned option on an element that otherwise exists. The note keeps no `status` in frontmatter; the section carries its own marks:

```markdown
## Score field binding (speculative)

> [!warning] Speculative — not built.

The chart reads its value from `scoreField`…
```

Heading suffix **and** banner. The suffix survives into the outline and the folding UI, where the banner is invisible.

Nesting rule: a speculative section may not contain a descriptive subsection. If a section is mostly speculative with a built core, split it.

## Not the same as Roadmap

Every note ends with a **Roadmap** list. These are different jobs and neither replaces the other:

| | Roadmap bullet | Speculative note or section |
| --- | --- | --- |
| What it is | A line naming work not yet designed | The design itself, written out |
| Length | One sentence | As long as a spec needs |
| Buildable from | No | Yes — that is the test |

A roadmap bullet is the todo. When it gets designed, the design becomes a speculative note or section, and the bullet is replaced by a link to it.

## Writing one

- **Present tense, no hedging.** "The palette opens on `⌘K`", not "the palette would open". The banner does the hedging; the body does the specifying.
- **Buildable is the bar.** If someone could not implement the note without asking you a question, the question belongs in an **Open questions** section — named, not left implicit in vague prose.
- **Nothing may depend on it.** A descriptive note may link to a speculative one, but may not state its content as fact or rely on it to hold. Speculation flows one way.
- **No citations to it as evidence.** A speculative note is not a source.

## Promotion

When the thing gets built, in this order:

1. **Reconcile against the code.** Every claim in the note checked against what actually shipped, to the standard of [[doc-drift-audit]]. The spec led the build; the build will still have diverged somewhere. The code wins.
2. **Remove all three marks** — `status`, banner, description suffix.
3. **Update the folder `index.md`** listings so they pick up the new description.
4. **Log it** in the root `log.md` as a `**Built**` entry, naming the note and any place the implementation departed from the spec.

Step 1 comes first and is not optional. Dropping the flag is what makes the note load-bearing — do it before the reconcile and NUIdocs has acquired a confident description of code nobody checked.

If a speculative note is abandoned rather than built, delete it and note that in `log.md`. A stale design left lying around marked is still noise, and the marker's value decays with every one that will never ship.

## Lint

- Census: `status: speculative` in frontmatter. Strip fenced code blocks before checking the body marks, or this note's own examples register as findings.
- Every note with `status: speculative` has the banner and the description suffix; every note with the banner has the frontmatter key.
- No descriptive note states a speculative note's content as fact.
- No speculative note carries a `status` promoted without a reconcile entry in `log.md`.

## See also

- [[writing-nuidocs]] — the rest of the editorial rules for these notes

## Roadmap

- None
