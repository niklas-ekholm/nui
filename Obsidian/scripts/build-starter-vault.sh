#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OBSIDIAN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_DIR="${OBSIDIAN_DIR}/starter-vault"
OUTPUT_DIR="${1:-${OBSIDIAN_DIR}/dist/nui-starter-vault}"

if [[ ! -f "${OBSIDIAN_DIR}/plugin/main.js" ]]; then
	echo "error: plugin main.js not found — run sync-from-vault.sh first (after npm run build)" >&2
	exit 1
fi

if [[ ! -f "${OBSIDIAN_DIR}/theme/theme.css" ]]; then
	echo "error: theme not found — run sync-from-vault.sh first" >&2
	exit 1
fi

rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

echo "Assembling starter vault at ${OUTPUT_DIR}..."
rsync -a \
	--exclude '.obsidian/' \
	--exclude 'README.md' \
	"${TEMPLATE_DIR}/" "${OUTPUT_DIR}/"

mkdir -p "${OUTPUT_DIR}/.obsidian/plugins/nui"
mkdir -p "${OUTPUT_DIR}/.obsidian/themes/NUI"

rsync -a \
	"${OBSIDIAN_DIR}/plugin/manifest.json" \
	"${OBSIDIAN_DIR}/plugin/main.js" \
	"${OBSIDIAN_DIR}/plugin/styles.css" \
	"${OUTPUT_DIR}/.obsidian/plugins/nui/"

rsync -a \
	"${OBSIDIAN_DIR}/theme/manifest.json" \
	"${OBSIDIAN_DIR}/theme/theme.css" \
	"${OUTPUT_DIR}/.obsidian/themes/NUI/"
if [[ -d "${OBSIDIAN_DIR}/theme/fonts" ]]; then
	rsync -a "${OBSIDIAN_DIR}/theme/fonts/" "${OUTPUT_DIR}/.obsidian/themes/NUI/fonts/"
fi

rsync -a "${TEMPLATE_DIR}/.obsidian/" "${OUTPUT_DIR}/.obsidian/"

echo "Starter vault ready: ${OUTPUT_DIR}"
