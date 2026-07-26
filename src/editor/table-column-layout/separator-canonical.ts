import type { ChangeSpec, Text, Transaction } from "@codemirror/state";
import {
	compactSeparatorRow,
	parseMarkdownTables,
	splitPipeTableRow,
	tableSignature,
} from "./parse-table-layout";
import type { ParsedMarkdownTable } from "./types";

export type CanonicalStore = Map<string, string>;

export interface TablePosition {
	table: ParsedMarkdownTable;
	headerCmLine: number;
	separatorCmLine: number;
	signature: string;
}

export function tablePositionsFromContent(content: string): TablePosition[] {
	const lines = content.split("\n");
	const tables = parseMarkdownTables(content);

	return tables.map((table) => {
		const headerLine = lines[table.separatorLine - 1] ?? "";
		const headerCells = splitPipeTableRow(headerLine);
		return {
			table,
			headerCmLine: table.separatorLine,
			separatorCmLine: table.separatorLine + 1,
			signature: tableSignature(headerCells),
		};
	});
}

export function tablePositionsFromDoc(doc: Text): TablePosition[] {
	return tablePositionsFromContent(doc.toString());
}

export function seedCanonicalStore(
	doc: Text,
	store: CanonicalStore,
): CanonicalStore {
	const next = new Map(store);

	for (const { signature, separatorCmLine } of tablePositionsFromDoc(doc)) {
		if (next.has(signature) || separatorCmLine > doc.lines) {
			continue;
		}
		const line = doc.line(separatorCmLine);
		next.set(signature, compactSeparatorRow(line.text));
	}

	return next;
}

export function isSeparatorOnlyEdit(
	tr: Transaction,
	separatorCmLine: number,
): boolean {
	if (!tr.docChanged) {
		return false;
	}

	let separatorChanged = false;
	let otherChanged = false;

	tr.changes.iterChangedRanges((fromA, toA) => {
		const doc = tr.startState.doc;
		const startLine = doc.lineAt(fromA).number;
		const endLine = doc.lineAt(Math.max(fromA, toA - 1)).number;

		for (let lineNo = startLine; lineNo <= endLine; lineNo++) {
			if (lineNo === separatorCmLine) {
				separatorChanged = true;
			} else {
				otherChanged = true;
			}
		}
	});

	return separatorChanged && !otherChanged;
}

export interface SeparatorFixResult {
	changes: ChangeSpec[];
	canonical: CanonicalStore;
}

export function buildSeparatorFixes(
	doc: Text,
	store: CanonicalStore,
	tr?: Transaction,
): SeparatorFixResult {
	const canonical = seedCanonicalStore(doc, store);
	const changes: ChangeSpec[] = [];

	for (const { signature, separatorCmLine } of tablePositionsFromDoc(doc)) {
		if (separatorCmLine > doc.lines) {
			continue;
		}
		const line = doc.line(separatorCmLine);
		const current = line.text;
		const compact = compactSeparatorRow(current);
		let stored = canonical.get(signature);

		if (stored === undefined) {
			stored = compact;
			canonical.set(signature, stored);
		}

		if (current === stored) {
			continue;
		}

		const userEdit =
			tr !== undefined && isSeparatorOnlyEdit(tr, separatorCmLine);

		if (userEdit) {
			canonical.set(signature, compact);
			if (compact !== current) {
				changes.push({
					from: line.from,
					to: line.to,
					insert: compact,
				});
			}
			continue;
		}

		if (current !== stored) {
			changes.push({
				from: line.from,
				to: line.to,
				insert: stored,
			});
		}
	}

	return { changes, canonical };
}

export interface LineReplacement {
	line: number;
	text: string;
}

export function restoreSeparatorsInContent(
	content: string,
	store: CanonicalStore,
): {
	content: string;
	canonical: CanonicalStore;
	replacements: LineReplacement[];
} {
	const lines = content.split("\n");
	const positions = tablePositionsFromContent(content);
	const canonical = new Map(store);
	const replacements: LineReplacement[] = [];

	for (const { signature, separatorCmLine } of positions) {
		const index = separatorCmLine - 1;
		const current = lines[index] ?? "";

		let stored = canonical.get(signature);
		if (stored === undefined) {
			stored = compactSeparatorRow(current);
			canonical.set(signature, stored);
		}

		if (current === stored) {
			continue;
		}

		lines[index] = stored;
		replacements.push({ line: index, text: stored });
	}

	return {
		content: lines.join("\n"),
		canonical,
		replacements,
	};
}
