# NUI Starter Vault

Minimal Obsidian vault for trying **NUI Plugin** and **NUI Theme**.

## Quick start

1. Download `nui-starter-vault-<version>.zip` from [GitHub Releases](https://github.com/niklas-ekholm/nui/releases)
2. Unzip anywhere
3. In Obsidian: **Open folder as vault** → select the unzipped folder
4. Open `index/index.md` for the main dashboard

Plugin, theme, and vault settings are pre-configured.

## What's included

```
index/
├── index.md              Dashboard (Contents, Tasks, Timeline)
├── Getting started.md    Intro note with sample tasks
├── Sample timeline.md    Timeline demo (start/end frontmatter)
├── Contents.base         Navigation and file lists
├── Timeline.base         Timeline views
├── Tracker.base          Week habit tracker
├── Year.base             Year-at-a-glance tracker
├── Tasks.base            Task lists
└── ┼/
    ├── ┼.md              Inbox / daily notes hub
    ├── 2026-07-14.md     Sample daily note
    └── Walk/             Sample habit bundle
        ├── Walk.md
        ├── 2026-07-14.md
        └── 2026-07-12.md
```

## Sample notes

| Note | Demonstrates |
|------|--------------|
| `Getting started.md` | Tasks → `Tasks.base` on index dashboard |
| `Sample timeline.md` | `start` / `end` properties → `Timeline.base` |
| `┼/Walk/` | Habit folder with dated notes → `Tracker.base` on `┼.md` |
| `┼/2026-07-14.md` | Daily note format |

## Fonts

The release zip includes Bookish variable fonts when present in the synced theme. Blockquotes fall back to Georgia / Times if fonts are removed.

## See also

- [NUI Plugin](../plugin/README.md)
- [NUI Theme](../theme/README.md)
