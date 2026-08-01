---
type: Implementation
status: speculative
title: NUI Finance
description: "A second Obsidian plugin rendering a financial dashboard from markdown notes and frontmatter alone. Speculative — not built."
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# NUI Finance

> [!warning] Speculative — not built.
> This note is the design, written to be built against. Nothing here describes shipped code.

A second Obsidian plugin, separate from [[nui-plugin]]. It renders a financial dashboard — bills due, cashflow, spending by category, account balances — from markdown notes and their frontmatter. No database, no import format, no state outside the vault.

## Purpose

The vault already tracks money the way it tracks everything else: badly, in a checklist. `Finance/finance tasks.md` is four unchecked boxes reading *Maksa OP lasku, Maksa DNA lasku, Maksa DNA intrum lasku, Maksa Vuokra*. That list cannot say what is overdue, what a month costs, or where the money went.

NUI Finance keeps the markdown-and-frontmatter substrate — every fact stays a note you can open, link, and edit by hand — and adds the four views that make the file tree answer those questions.

## Principle: nothing derived is stored

Amounts, dates, and cadences are stored. Next-due dates, running balances, monthly totals, and overdue flags are **computed at render time and never written back to a note**. A vault where the plugin has never run must be indistinguishable from one where it has.

This follows the folder-derived rule that habits already obey — [[habit-create]] writes three things and no registry — and it is what makes the data survive the plugin.

## Data model

Four `type` values, all under `Finance/`. Currency is EUR throughout; v1 is single-currency.

```
Finance/
  index.md
  accounts/
    op-käyttötili/
      index.md                       -- type: Account
      2026-07-01 OP Käyttötili.md    -- type: Balance
      2026-08-01 OP Käyttötili.md
  obligations/
    vuokra/
      index.md                       -- type: Obligation
      2026-07-04 Vuokra.md           -- type: Payment
      2026-08-04 Vuokra.md
    dna/
      index.md
      2026-07-15 DNA.md
```

Obligations and accounts are **bundles** — a folder with an `index.md` and dated child notes — the same shape habits use. This is deliberate: the rename machinery (`isHabitBundleRename`, `listOwnFilesInHabitFolder`, `siblingHabitFolderPath`) already handles depth, nesting, and in-place child renames correctly, and folder-scoped bases (`file.inFolder(this.file.folder)`) give every obligation its own payment history with no per-obligation configuration.

Dated child notes use the habit day-note filename, `{YYYY-MM-DD} {Bundle Name}.md`, so the existing date resolution in `src/bases/entry-date.ts` applies unchanged.

### Obligation

A recurring commitment, in either direction. Rent, a phone bill, a loan instalment, a salary.

```yaml
---
type: Obligation
title: Vuokra
description: Monthly rent.
direction: out          # out | in — default out
amount: 850.00
cadence: monthly        # weekly | monthly | quarterly | yearly | once
dueDay: 4               # 1–31, clamped to the month's length
category: housing
account: op-käyttötili
active: true
timestamp: 2026-07-25T00:00:00Z
---
```

`direction` is explicit rather than a signed amount. Sign conventions in hand-edited YAML are a reliable source of error, and `-850` reads as a correction rather than an outgoing.

For `cadence: weekly`, `dueWeekday` (1 = Monday) replaces `dueDay`. For `cadence: once`, `dueDate` (a full date) replaces both.

`active: false` retires an obligation without deleting its history — it stops generating occurrences from that point but its past payments still count in cashflow and breakdown.

### Payment

One settlement event. The dated child note of its obligation.

```yaml
---
type: Payment
title: Vuokra 2026-07-04
amount: 850.00          # optional — defaults to the obligation's amount
account: op-käyttötili  # optional — defaults to the obligation's account
category: housing       # optional — defaults to the obligation's category
settles: 2026-07-04     # optional — see below
timestamp: 2026-07-25T00:00:00Z
---
```

Everything except the date is optional. A payment note that is nothing but frontmatter `type: Payment` and a filename date is valid and means *paid, in full, on time* — the common case must be the cheapest to record.

**Which occurrence a payment settles.** By default, the occurrence whose due date is nearest the payment's own date, within half a cadence period either side. Pay rent three days late and it settles that month; pay it three weeks early and it settles next month. Where that guess is wrong — a double payment, a catch-up on an arrear — `settles` names the occurrence's due date explicitly and wins.

A payment that resolves to no occurrence (outside the window, or on a retired obligation) still counts in cashflow and breakdown, but appears in no ledger row. It is not an error.

**Partial payments.** Two payments settling the same occurrence sum. An occurrence is settled when the sum reaches its amount; below that it is **partial** and the ledger shows the remainder.

### Account

A place money sits. Bundle; `index.md` carries the metadata.

```yaml
---
type: Account
title: OP Käyttötili
kind: checking          # checking | savings | credit | loan
category: null          # unused; accounts are not categorised
timestamp: 2026-07-25T00:00:00Z
---
```

### Balance

A dated snapshot, the dated child note of its account. Snapshots are sparse — record one when you happen to look.

```yaml
---
type: Balance
title: OP Käyttötili 2026-07-01
balance: 2431.07
timestamp: 2026-07-25T00:00:00Z
---
```

Balances are **snapshots, not derived from payments**. The plugin never reconstructs a balance by summing transactions — the vault will never hold every transaction, and a reconstructed balance that silently disagrees with the bank is worse than no balance. Between two snapshots the balance line interpolates nothing; it draws point to point and says so.

### Money handling

Amounts are written as decimals because that is what a human types. They are parsed to **integer cents on read and summed as integers**, formatted back only at render. No total is ever produced by adding JavaScript floats.

A non-finite, negative, or unparseable `amount` makes the note **invalid**, not zero. Invalid notes are excluded from every total and listed in the affected view's empty/error state with their path. Silently treating a typo as zero is how a dashboard lies.

### Categories

Free lowercase-hyphen strings — `housing`, `utilities`, `groceries`. No registry note and no validation; the breakdown view lists whatever it finds. A category with no obligations or payments does not exist.

## Views

Four Bases view types, registered by NUI Finance rather than NUI Plugin.

| Menu name | Type id | Answers |
| --------- | ------- | ------- |
| Finance: Ledger | `nui-finance-ledger` | What is due, overdue, or settled |
| Finance: Cashflow | `nui-finance-cashflow` | In versus out, per month |
| Finance: Breakdown | `nui-finance-breakdown` | Where it went, by category |
| Finance: Balance | `nui-finance-balance` | What each account held, over time |

All four take their scope from the base's filters like every other NUI view, and their variant from the **view name**, following [[month|Tracker — Month]] and [[score-chart|Score Chart]].

### Ledger

Rows are **occurrences**, not notes — one row per scheduled instance of an obligation inside the visible window, generated from `cadence` and `dueDay`. The default window is the current month plus a 14-day lookahead.

| State | Condition | Appearance |
| ----- | --------- | ---------- |
| `paid` | Settled in full | Muted row, amount struck |
| `partial` | Payments sum below the amount | Amount shows remainder |
| `due` | Unsettled, due date in the future | Default row |
| `overdue` | Unsettled, due date passed | **accent** on the date cell |
| `inactive` | `active: false` | Hidden unless the view name is `all` |

Layout follows [[2-elements/list/index|List]] — a row per occurrence, obligation title left, due date and amount right. Clicking a row opens the obligation's `index.md`. Clicking the date cell of an unsettled occurrence creates its payment note, pre-dated and pre-named, the way [[habit-create]] creates a habit.

That click is the whole point of the view: it is the thing that replaces the checklist.

### Cashflow

Grouped bars per month across the visible range — `in` up, `out` down, from payments, not from obligations. A thin net line runs across. Rendering extends [[score-chart|Score Chart]]'s inline SVG rather than introducing a chart library.

View name `projected` adds unsettled future occurrences as outlined bars, so the next three months read as commitment rather than history.

### Breakdown

Category totals over the visible range, as a sorted horizontal bar list — category name, bar, amount, share. Outgoings only unless the view name is `in`.

No pie chart. Angle is a poor encoding for comparison and half the categories in a real month are too thin to label.

### Balance

One line per account over time, from `Balance` snapshots. Points are marked; segments between distant snapshots are drawn dashed past a 45-day gap, so a straight run between two far-apart points is never mistaken for known data.

View name `net` sums all accounts into a single line, subtracting `kind: credit` and `kind: loan`.

## Chrome and foundations

No view has its own toolbar; host chrome comes from [[2-elements/embed-chrome/index|Embed Chrome]]. Tokens resolve from [[nui-theme]] inside `.nui-text-scope` — NUI Finance ships **no palette of its own** and no hex values, per [[scope-boundary]].

- [[ghost-chrome]] — no fills on chart frames or ledger rows
- [[color]] — **accent** for overdue and for the net line, **ui** for gridlines and axis labels
- [[typography]] — **small** for axis labels and amounts; tabular figures for every amount column
- [[two-tier-text]] — amounts are content, labels are UI

Amounts align on the decimal separator. A column of money that does not align is unreadable at a glance, which is the only way anyone reads a dashboard.

## States

| State | Appearance |
| ----- | ---------- |
| No matching notes | Muted message naming the expected `type` |
| Some notes invalid | View renders from the valid ones, with a footer counting the invalid and linking each |
| Obligation with no payments ever | Ledger row `due`/`overdue` as dates dictate; never an error |
| Account with one snapshot | Single point, no line, no interpolation |

## Implementation

Separate plugin at `.obsidian/plugins/nui-finance`, its own `manifest.json` and build in `~/Sites/nui-build`.

| Area | Path |
| ---- | ---- |
| View registration | `src/main.ts` |
| Occurrence generation | `src/core/schedule.ts` |
| Payment matching | `src/core/settle.ts` |
| Money parsing and arithmetic | `src/core/money.ts` |
| Ledger render | `src/core/ledger/render-ledger.ts` |
| Cashflow render | `src/core/cashflow/render-cashflow.ts` |
| Breakdown render | `src/core/breakdown/render-breakdown.ts` |
| Balance render | `src/core/balance/render-balance.ts` |
| Entry reading | `src/bases/finance-from-entries.ts` |

`schedule.ts`, `settle.ts`, and `money.ts` take no Obsidian imports, so they are unit tested directly — the same discipline that made `habit-path.ts` testable. Month-end clamping (`dueDay: 31` in February), the settle window at cadence boundaries, and cent rounding are the cases that will break.

### What it borrows from NUI Plugin

Being a separate plugin means duplicating infrastructure that already exists. Named honestly:

| Needed | Exists at | Plan |
| ------- | --------- | ---- |
| Date resolution from filename/frontmatter | `src/bases/entry-date.ts` | Copy for v1; extract to a shared module if a third plugin appears |
| Bundle detection and rename | `src/habits/habit-bundle.ts`, `habit-path.ts` | Generalise from "habit" to "bundle" in NUI Plugin, then depend on it |
| Text-scope tokens | [[nui-theme]] | Depend on the theme; no duplication |
| Embed chrome | NUI Plugin | Depend on NUI Plugin being installed |

The rename generalisation is a prerequisite, not a nice-to-have: without it, renaming an obligation leaves its payment notes behind, which is the exact bug [[doc-drift-audit]] §7 fixed for habits.

## Privacy

This vault syncs through iCloud, and account balances are the most sensitive thing it would then hold. The design keeps account **numbers** out entirely — an `Account` note has a name and a kind, never an IBAN — and holds balances only as sparse manual snapshots. Nothing here talks to a bank, and no credential is stored in the vault.

## Open questions

Named rather than papered over, per [[speculative-documentation|Speculative Documentation]]. Each blocks part of the build.

1. **Obligation metadata in `index.md`.** The vault schema says `index.md` carries no frontmatter, excepting NUI-functional keys on folder hubs. Habits need no metadata and so never tested this. Obligations put real data in a hub note — a defensible reading of the exception, or a violation of it. The alternative is flat `Finance/obligations/dna.md` notes with payments referencing them by wikilink, which is OKF-cleaner but loses folder-scoped bases and the rename machinery. **This decides the whole file layout and must be settled before anything is written.**
2. **Is the ledger even a Bases view?** Its rows are generated occurrences, not files, so it inverts what a Bases view is for. Every other NUI view maps entries to rows. This one maps a schedule to rows and looks up files. It may want to be a plugin view or a code block instead.
3. **`Finance/` bundles among habit bundles.** Bundle detection is currently rooted at `Habits/`. Generalising it needs a rule for which roots hold which bundle kinds, or `type`-based detection instead of path-based.
4. **Intrum.** `finance tasks.md` lists *DNA intrum lasku* — a debt collection instalment alongside the ordinary DNA bill. Arrears are neither a clean recurring obligation nor a one-off. Left unmodelled in v1; a real design needs a payment plan with a total, a remaining balance, and an end.
5. **Multi-currency.** Out of scope for v1, but the cent representation should be decided knowing whether a currency field is coming, since retrofitting one across stored amounts is expensive.

## See also

- [[nui-plugin]] — the plugin this one sits beside and borrows from
- [[speculative-documentation|Speculative Documentation]] — why this note is marked and what promoting it requires

## Roadmap

- Settle open question 1 — nothing can be built before the file layout is fixed
- Generalise bundle detection and rename in NUI Plugin as a prerequisite
- Build Ledger first and alone; it is the view that replaces `finance tasks.md`, and the other three are worth nothing until there is data to draw
- Write a Product recipe under [[3-implementations/obsidian/product/index|Product]] once a `.base` uses any of these views
