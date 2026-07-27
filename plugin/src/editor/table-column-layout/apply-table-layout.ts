import { isSeparatorCellContent } from "./parse-table-layout";
import type { TableColumnSpec } from "./types";

const LAYOUT_FLAG = "nuiTableLayout";

function fillWeightTotal(columns: TableColumnSpec[]): number {
	return columns
		.filter((col) => col.mode === "fill")
		.reduce((sum, col) => sum + col.weight, 0);
}

function applyColumnClasses(
	table: HTMLTableElement,
	columns: TableColumnSpec[],
): void {
	const rows = table.querySelectorAll("tr");
	for (const row of Array.from(rows)) {
		const cells = row.querySelectorAll(":scope > th, :scope > td");
		for (let i = 0; i < columns.length; i++) {
			const cell = cells[i];
			const col = columns[i];
			if (!cell || !col) {
				continue;
			}
			cell.classList.add(`nui-table-col-${col.mode}`);
			cell.classList.add(`nui-table-align-${col.align}`);
		}
	}
}

function ensureColgroup(
	table: HTMLTableElement,
	columns: TableColumnSpec[],
): void {
	let colgroup = table.querySelector("colgroup");
	if (!colgroup) {
		colgroup = document.createElement("colgroup");
		table.insertBefore(colgroup, table.firstChild);
	}

	colgroup.replaceChildren();

	const shrinkCount = columns.filter((col) => col.mode === "shrink").length;
	const fillTotal = fillWeightTotal(columns);
	// Fill col % must not sum to 100% when shrink cols also take space.
	const fillWidthBudget = shrinkCount > 0 ? 100 - shrinkCount : 100;

	for (const col of columns) {
		const colEl = document.createElement("col");
		if (col.mode === "shrink") {
			colEl.className = "nui-table-col-shrink";
		} else if (fillTotal > 0) {
			colEl.style.width = `${(col.weight / fillTotal) * fillWidthBudget}%`;
		}
		colgroup.appendChild(colEl);
	}
}

/** Obsidian renders invalid `^` separator rows as a body row — hide them. */
function hidePhantomSeparatorRow(table: HTMLTableElement): void {
	const tbody = table.querySelector("tbody");
	const firstRow = tbody?.querySelector(":scope > tr:first-child");
	if (!firstRow) {
		return;
	}

	const cells = firstRow.querySelectorAll(":scope > th, :scope > td");
	if (cells.length === 0) {
		return;
	}

	const looksLikeSeparator = Array.from(cells).every((cell) =>
		isSeparatorCellContent(cell.textContent ?? ""),
	);
	if (looksLikeSeparator) {
		firstRow.classList.add("nui-table-phantom-separator");
	}
}

export function applyTableColumnLayout(
	table: HTMLTableElement,
	columns: TableColumnSpec[],
): void {
	if (table.dataset[LAYOUT_FLAG] === "1") {
		return;
	}

	table.dataset[LAYOUT_FLAG] = "1";
	table.classList.add("nui-table-layout");

	hidePhantomSeparatorRow(table);

	const allShrink = columns.every((col) => col.mode === "shrink");
	if (allShrink) {
		table.classList.add("nui-table-all-shrink");
	}

	ensureColgroup(table, columns);
	applyColumnClasses(table, columns);
}
