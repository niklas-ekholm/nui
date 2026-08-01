# Behavior

Create, rename, and delete behaviour in NUI Plugin. Source: `plugin/src` in the [nui monorepo](https://github.com/niklas-ekholm/nui); dev build targets `vault-example/.obsidian/plugins/nui/`.

## In this section

- [[folder-index-create|Folder Index Create]] — Hubs are created on demand when a folder is opened, not when it is created.
- [[folder-index-rename|Folder Index Rename]] — Folder names and index.md are independent — a rename syncs nothing, by design.
- [[folder-index-v1-0|Folder Index (v1.0)]] — How the v1.0 index.md folder hub behaves — a breaking change from the 0.1.x hub-note model.
- [[habit-create|Habit Create]] — Creating a habit folder and its index note from the + button on an embedded Week x3 tracker.
- [[habit-delete|Habit Delete]] — Deleting a habit is deleting its folder — no bookkeeping is needed or performed.
- [[habit-rename-from-folder|Habit Rename From Folder]] — Renaming a habit by renaming its folder, which renames its day notes to match.
- [[habit-rename-from-index-note|Habit Rename From Index Note]] — Legacy-only path — renaming a habit by renaming a same-named hub note, which no v1.0 bundle has.

## Purpose

Vault create and rename rules implemented in the NUI Plugin. One owner per `vault.on("rename")` concern.

---

## Principles

1. **One owner per concern.** Two listeners must not react to the same `vault.on("rename")` event. `FolderIndexManager` owns header refresh; `HabitRenameManager` owns habit bundles.
2. **Names are structural only where they must be.** Folder names and note names are independent ([[folder-index-rename]]); habit day notes are the one exception, because the habit name is part of the filename.
3. **Depth is never assumed.** Habits nest, so predicates test *inside the habits root* rather than *direct child of it*, and a habit's own files are those not owned by a nested habit. Path logic lives in `habit-path.ts`, with no Obsidian imports, so it is unit tested.
4. **Habits are folders, not tags.** Nothing writes a habit name into a `.base` file. Rows come from the folder tree at render time.
5. **Filename rule.** If a basename contains the old habit name, replace that substring. Date prefixes and other suffixes stay.
6. **No vault-wide scans.** List files in the affected folder only.

---

## Habit bundle layout

A habit is a folder under the habits root, `Habits` (`DEFAULT_CALENDAR_FOLDER`):

```
Habits/
  index.md            -- embeds ![[Tracker.base]], the Week x3 board
  Chess/
    index.md          -- embeds ![[Year.base#2026]]
    2026-07-10 Chess.md
    2026-07-12 Chess.md
```

| Concept | Rule |
| ------- | ---- |
| Habit | A folder containing a hub note (`isHabitBundleFolder`) |
| Habit name | The folder name |
| Hub note | `index.md`, H1 = habit name; legacy `{Folder}.md` still recognised |
| Day note | `{YYYY-MM-DD} {HabitName}.md` with `date: {YYYY-MM-DD}` frontmatter |
| Optional day rating | `rating: 1`–`5` in frontmatter, rendered on the day mark |
| Year grid | `![[Year.base#{year}]]` — the shared `┼/Bases/Year.base`, scoped to the embedding folder |
| Week board | `![[Tracker.base]]` — the shared `┼/Bases/Tracker.base`, rows = child folders |

Both bases filter on `file.inFolder(this.file.folder)`, which is what makes one shared base serve every habit. Nesting works for free: a habit folder that itself contains habit folders can embed `Tracker.base` and act as a group (`Habits/Liikunta`). A nested habit is a habit in every respect — it appears as a row, and it renames like one ([[habit-rename-from-folder]]).

## Where the date comes from

`readDate` tries, in order: the view's configured `dateField` (`note.date` in both bases), then `note.date` / `note.Start Date` / `note.startDate` / `note.start`, then the leading `YYYY-MM-DD` of the filename. So a day note missing its frontmatter still lands on the right day via its name.
