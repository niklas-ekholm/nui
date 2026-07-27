import type { TableColumnAlign, TableColumnSpec, ParsedMarkdownTable } from "./types";

export function tableSignature(headerCells: string[]): string {
	return `${headerCells.length}\x1e${headerCells.map((cell) => cell.trim()).join("\x1e")}`;
}

/** Pandoc pipe-table separator: colons = alignment; `-`×1 = shrink; `-`×N (N≥2) or `^` = shrink alias; else fill weight N. */
export function parseSeparatorCell(cell: string): TableColumnSpec {
	const trimmed = cell.trim();
	let align: TableColumnAlign = "left";
	let inner = trimmed;

	if (inner.startsWith(":") && inner.endsWith(":") && inner.length >= 2) {
		align = "center";
		inner = inner.slice(1, -1);
	} else if (inner.startsWith(":")) {
		align = "left";
		inner = inner.slice(1);
	} else if (inner.endsWith(":")) {
		align = "right";
		inner = inner.slice(0, -1);
	}

	if (/^\^+$/.test(inner)) {
		return { mode: "shrink", weight: 0, align };
	}

	if (/^-+$/.test(inner)) {
		if (inner.length === 1) {
			return { mode: "shrink", weight: 0, align };
		}
		return { mode: "fill", weight: inner.length, align };
	}

	return { mode: "fill", weight: 1, align };
}

export function splitPipeTableRow(line: string): string[] {
	let trimmed = line.trim();
	if (trimmed.startsWith("|")) {
		trimmed = trimmed.slice(1);
	}
	if (trimmed.endsWith("|")) {
		trimmed = trimmed.slice(0, -1);
	}
	return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
	if (cells.length === 0) {
		return false;
	}
	return cells.every((cell) => /^:?[\-\^]+:?$/.test(cell));
}

function rowLooksLikeTableRow(line: string): boolean {
	const trimmed = line.trim();
	return trimmed.includes("|") && trimmed.length > 0;
}

export function parseMarkdownTables(content: string): ParsedMarkdownTable[] {
	const lines = content.split("\n");
	const tables: ParsedMarkdownTable[] = [];

	for (let i = 0; i < lines.length - 1; i++) {
		const headerLine = lines[i];
		if (!rowLooksLikeTableRow(headerLine)) {
			continue;
		}

		const headerCells = splitPipeTableRow(headerLine);
		if (headerCells.length < 1) {
			continue;
		}

		const separatorLine = lines[i + 1];
		if (!rowLooksLikeTableRow(separatorLine)) {
			continue;
		}

		const separatorCells = splitPipeTableRow(separatorLine);
		if (separatorCells.length !== headerCells.length) {
			continue;
		}

		if (!isSeparatorRow(separatorCells)) {
			continue;
		}

		tables.push({
			separatorLine: i + 1,
			columns: separatorCells.map(parseSeparatorCell),
		});
		i++;
	}

	return tables;
}

/** True when cell text looks like a markdown separator cell (^ or - markers). */
export function isSeparatorCellContent(text: string): boolean {
	return /^:?[\-\^]+:?$/.test(text.trim());
}

function separatorCellInner(cell: string): string {
	const trimmed = cell.trim();
	let inner = trimmed;
	if (inner.startsWith(":") && inner.endsWith(":") && inner.length >= 2) {
		inner = inner.slice(1, -1);
	} else if (inner.startsWith(":")) {
		inner = inner.slice(1);
	} else if (inner.endsWith(":")) {
		inner = inner.slice(0, -1);
	}
	return inner;
}

export function isSeparatorRowLine(line: string): boolean {
	const cells = splitPipeTableRow(line);
	if (cells.length === 0) {
		return false;
	}
	return cells.every((cell) => /^:?[\-\^]+:?$/.test(cell));
}

export function formatSeparatorCell(
	spec: TableColumnSpec,
	sourceCell?: string,
): string {
	const sourceInner = sourceCell ? separatorCellInner(sourceCell) : "";
	let inner: string;

	if (spec.mode === "shrink") {
		inner = /^\^+$/.test(sourceInner) ? "^" : "-";
	} else {
		inner = "-".repeat(spec.weight);
	}

	if (spec.align === "center") {
		return `:${inner}:`;
	}
	if (spec.align === "right") {
		return `${inner}:`;
	}
	if (spec.align === "left" && sourceCell?.trim().startsWith(":")) {
		return `:${inner}`;
	}
	return inner;
}

/** Minimal separator row — one shrink dash, N fill dashes, alignment colons preserved. */
export function compactSeparatorRow(line: string): string {
	if (!isSeparatorRowLine(line)) {
		return line;
	}

	const cells = splitPipeTableRow(line);
	const compacted = cells.map((cell) =>
		formatSeparatorCell(parseSeparatorCell(cell), cell),
	);
	return `| ${compacted.join(" | ")} |`;
}
