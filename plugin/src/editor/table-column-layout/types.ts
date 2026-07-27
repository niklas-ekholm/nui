export type TableColumnAlign = "left" | "center" | "right";

export type TableColumnMode = "shrink" | "fill";

export interface TableColumnSpec {
	mode: TableColumnMode;
	weight: number;
	align: TableColumnAlign;
}

export interface ParsedMarkdownTable {
	separatorLine: number;
	columns: TableColumnSpec[];
}
