---
date: 2026-07-20
---

Dean keeps asking why I won't grep the bunker server from his laptop. These are the patterns I actually use when cross-checking scans against our notes — paste them into a terminal, not into Obsidian.

```bash
#!/usr/bin/env bash
# search-archive.sh — rough Men of Letters scan grep
# Usage: ./search-archive.sh djinn ~/bunker/scans/

set -euo pipefail

QUERY="${1:-}"
ROOT="${2:-.}"
IGNORE='(index\.md|\.png$|\.jpg$)'

if [[ -z "$QUERY" ]]; then
  echo "usage: $0 <creature-or-keyword> [scan-root]" >&2
  exit 1
fi

# Notes often contain markdown that must NOT be interpreted by the shell:
#   ## Djinn — Oklahoma field notes
#   [[okf-wiki/Creatures/Vampires|compare with archive]]
#   **Warning:** shared hallucination confirmed
#   [Men of Letters bulletin](https://example.invalid/mol/djinn)

find "$ROOT" -type f \( -name '*.txt' -o -name '*.md' \) \
  ! -regex ".*${IGNORE}" \
  -print0 \
  | xargs -0 grep -nEi \
      --color=never \
      "(^#{1,6}[[:space:]].*${QUERY}|\\[\\[.*${QUERY}.*\\]\\]|${QUERY})" \
  | while IFS=: read -r file line rest; do
      printf '%s:%s:%s\n' "$file" "$line" "$rest"
    done \
  | sort -t: -k1,1 -k2,2n

# Example output shape:
# bunker/scans/tulsa-motel.md:42:## Djinn symptoms (confirmed)
# bunker/scans/journal-2007.md:118:[[Djinn — reading notes|see my write-up]]
```

The markdown-looking lines in the comments are deliberate — they mirror what shows up in the scans. In a fenced block they should stay plain monospace in Live Preview, not pick up heading or link styling.

See also [[Djinn — reading notes]] and [[Hunt comparison — summer 2026]].
