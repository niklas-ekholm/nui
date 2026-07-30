---
okf_version: 1
date: 2026-07-27
---

Reference material for the example vault — an **OKF wiki** (`okf-wiki/`) showing creatures, objects, and lore. Every folder here carries two notes side by side:

| File | Role |
| --- | --- |
| `{FolderName}.md` | **Hub note** — what NUI opens when you click the folder. Yours to write: prose, embeds, tasks. |
| `index.md` | **OKF sidecar** — a directory listing for the folder (OKF spec §3.1). Curated by hand or by an agent; NUI creates it empty and does not fill it in. |

**Folder-index always opens the hub**, never the sidecar. The sidecar exists so OKF-aware tools can read a predictable `index.md` in every folder without guessing which `{FolderName}.md` belongs to which directory. The two files may drift — nothing syncs them automatically. Treat the hub as the working note and the sidecar as the machine-readable table of contents.

Mark a space by setting `okf_version` once on its **root hub** (this note). Every folder beneath inherits OKF status and gets an `index.md` sidecar when created or first opened.

![[Navigation.base]]
