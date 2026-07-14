#!/usr/bin/env python3
"""Normalize blank lines at the top and bottom of vault text files."""

from __future__ import annotations

import argparse
from pathlib import Path

SKIP_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".DS_Store"}
SKIP_NAMES = {".DS_Store"}


def has_frontmatter(lines: list[str]) -> bool:
    if not lines or lines[0].strip() != "---":
        return False
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return True
    return False


def frontmatter_end_index(lines: list[str]) -> int:
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return i
    raise ValueError("unclosed frontmatter")


def strip_empty_edges(lines: list[str]) -> list[str]:
    while lines and lines[0].strip() == "":
        lines.pop(0)
    while lines and lines[-1].strip() == "":
        lines.pop()
    return lines


def normalize(content: str) -> str:
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    lines = strip_empty_edges(content.split("\n"))

    if not lines:
        return "\n\n"

    if has_frontmatter(lines):
        end = frontmatter_end_index(lines)
        frontmatter = lines[: end + 1]
        body = strip_empty_edges(lines[end + 1 :])

        result = frontmatter + [""]
        if body:
            result.extend(body)
        result.append("")
        return "\n".join(result) + "\n"

    return "\n" + "\n".join(lines) + "\n\n"


def is_probably_text(data: bytes) -> bool:
    if b"\x00" in data:
        return False
    try:
        data.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def iter_text_files(vault: Path) -> list[Path]:
    files: list[Path] = []
    for path in sorted(vault.rglob("*")):
        if not path.is_file():
            continue
        if path.name in SKIP_NAMES or path.suffix in SKIP_EXTENSIONS:
            continue
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        if is_probably_text(raw):
            files.append(path)
    return files


def process_vault(vault: Path, dry_run: bool = False) -> tuple[int, int]:
    changed = 0
    checked = 0

    for path in iter_text_files(vault):
        checked += 1
        original = path.read_text(encoding="utf-8")
        normalized = normalize(original)
        if normalized == original:
            continue
        changed += 1
        if dry_run:
            print(path.relative_to(vault))
        else:
            path.write_text(normalized, encoding="utf-8", newline="\n")

    return changed, checked


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize blank lines at the top and bottom of vault text files."
    )
    parser.add_argument(
        "vault",
        nargs="?",
        default=Path.home()
        / "Library/Mobile Documents/iCloud~md~obsidian/Documents/NipaNotes",
        type=Path,
        help="Path to the NipaNotes vault (default: iCloud NipaNotes)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print files that would change without writing",
    )
    args = parser.parse_args()

    vault = args.vault.expanduser().resolve()
    if not vault.is_dir():
        raise SystemExit(f"Vault not found: {vault}")

    changed, checked = process_vault(vault, dry_run=args.dry_run)
    action = "Would update" if args.dry_run else "Updated"
    print(f"{action}: {changed} of {checked} text files")


if __name__ == "__main__":
    main()
