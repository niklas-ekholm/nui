#!/usr/bin/env python3
"""Normalize tracker day notes: remove tags and use {date} {folder}.md naming."""

from __future__ import annotations

import re
from pathlib import Path

VAULT_ROOT = Path(
    "/Users/niklasekholm/Library/Mobile Documents/iCloud~md~obsidian/Documents/NipaNotes"
)
TARGET_ROOT = VAULT_ROOT / "index/𓁷"

ISO_DAY_BASENAME = re.compile(r"^(\d{4}-\d{2}-\d{2})$")
TAGGED_DAY_BASENAME = re.compile(r"^(\d{4}-\d{2}-\d{2}) (.+)$")
HABIT_TAG_LINE = re.compile(r"^#habit\s*$", re.IGNORECASE)


def has_frontmatter(lines: list[str]) -> bool:
    return bool(lines) and lines[0].strip() == "---"


def frontmatter_end_index(lines: list[str]) -> int:
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return i
    raise ValueError("unclosed frontmatter")


def parse_frontmatter_block(lines: list[str]) -> tuple[list[str], list[str]]:
    if not has_frontmatter(lines):
        return [], lines
    end = frontmatter_end_index(lines)
    return lines[1:end], lines[end + 1 :]


def remove_tags_from_frontmatter(frontmatter_lines: list[str]) -> list[str]:
    result: list[str] = []
    skipping_tags = False
    for line in frontmatter_lines:
        if re.match(r"^tags:\s*$", line):
            skipping_tags = True
            continue
        if skipping_tags:
            if re.match(r"^\s+-\s+", line):
                continue
            skipping_tags = False
        result.append(line)
    return result


def ensure_date_in_frontmatter(
    frontmatter_lines: list[str], date_key: str
) -> list[str]:
    for line in frontmatter_lines:
        if re.match(r"^date:\s*", line):
            return frontmatter_lines
    return [f"date: {date_key}", *frontmatter_lines]


def remove_habit_tag_lines(body_lines: list[str]) -> list[str]:
    return [line for line in body_lines if not HABIT_TAG_LINE.match(line.strip())]


def normalize_blank_lines(lines: list[str]) -> list[str]:
    while lines and lines[0].strip() == "":
        lines.pop(0)
    while lines and lines[-1].strip() == "":
        lines.pop()
    return lines


def build_content(frontmatter_lines: list[str], body_lines: list[str]) -> str:
    body_lines = normalize_blank_lines(body_lines)
    if frontmatter_lines:
        parts = ["---", *frontmatter_lines, "---", ""]
        if body_lines:
            parts.extend(body_lines)
            parts.append("")
        return "\n".join(parts)
    if not body_lines:
        return "\n"
    return "\n".join([*body_lines, ""])


def folder_label(path: Path) -> str:
    return path.parent.name


def process_file(path: Path) -> tuple[Path | None, bool]:
    original = path.read_text(encoding="utf-8")
    content = original.replace("\r\n", "\n").replace("\r", "\n")
    lines = content.split("\n")

    frontmatter_lines, body_lines = parse_frontmatter_block(lines)
    frontmatter_lines = remove_tags_from_frontmatter(frontmatter_lines)
    body_lines = remove_habit_tag_lines(body_lines)

    stem = path.stem
    date_match = ISO_DAY_BASENAME.match(stem)
    tagged_match = TAGGED_DAY_BASENAME.match(stem)
    label = folder_label(path)

    target_path = path
    if date_match:
        date_key = date_match.group(1)
        target_path = path.with_name(f"{date_key} {label}.md")
        frontmatter_lines = ensure_date_in_frontmatter(frontmatter_lines, date_key)
    elif tagged_match:
        date_key = tagged_match.group(1)
        frontmatter_lines = ensure_date_in_frontmatter(frontmatter_lines, date_key)

    new_content = build_content(frontmatter_lines, body_lines)
    changed = new_content != original or target_path != path

    if not changed:
        return None, False

    if target_path != path and target_path.exists():
        raise FileExistsError(f"Target already exists: {target_path}")

    if target_path != path:
        target_path.write_text(new_content, encoding="utf-8")
        path.unlink()
        return target_path, True

    path.write_text(new_content, encoding="utf-8")
    return path, True


def main() -> None:
    renamed = 0
    updated = 0

    for path in sorted(TARGET_ROOT.rglob("*.md")):
        result_path, changed = process_file(path)
        if not changed:
            continue
        updated += 1
        if result_path and result_path != path:
            renamed += 1
            print(f"rename: {path.relative_to(VAULT_ROOT)} -> {result_path.relative_to(VAULT_ROOT)}")
        else:
            print(f"update: {path.relative_to(VAULT_ROOT)}")

    print(f"Done. Updated {updated} file(s), renamed {renamed}.")


if __name__ == "__main__":
    main()
