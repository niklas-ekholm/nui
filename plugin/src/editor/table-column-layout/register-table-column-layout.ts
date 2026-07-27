import { ViewPlugin } from "@codemirror/view";
import type { App, Plugin, TFile } from "obsidian";
import { applyTableColumnLayout } from "./apply-table-layout";
import { parseMarkdownTables } from "./parse-table-layout";
import { createPreserveTableSeparatorRowsExtension } from "./preserve-table-separator-rows";
import {
	getSeparatorCanonicalStore,
	registerSeparatorGuard,
	setSeparatorCanonicalStore,
} from "./register-separator-guard";
import type { ParsedMarkdownTable } from "./types";

const TABLE_SELECTOR =
	".markdown-reading-view table, .markdown-preview-view table, .markdown-rendered table, .cm-table-widget table";

async function readTableSpecs(
	app: App,
	filePath: string,
): Promise<ParsedMarkdownTable[]> {
	const tfile = app.vault.getFileByPath(filePath);
	if (!tfile) {
		return [];
	}
	const content = await app.vault.cachedRead(tfile);
	return parseMarkdownTables(content);
}

function instrumentTablesInRoot(
	root: ParentNode,
	specs: ParsedMarkdownTable[],
): void {
	const tables = root.querySelectorAll(
		`${TABLE_SELECTOR}:not([data-nui-table-layout])`,
	);
	if (tables.length === 0) {
		return;
	}

	let index = 0;
	for (const table of Array.from(tables)) {
		if (!(table instanceof HTMLTableElement)) {
			continue;
		}
		const spec = specs[index];
		if (spec) {
			applyTableColumnLayout(table, spec.columns);
		}
		index++;
	}
}

function scheduleTableLayout(
	root: ParentNode,
	app: App,
	sourcePath: string,
): void {
	void readTableSpecs(app, sourcePath).then((specs) => {
		if (specs.length === 0) {
			return;
		}
		instrumentTablesInRoot(root, specs);
	});
}

export function tableColumnLayoutPostProcessor(plugin: Plugin) {
	return (element: HTMLElement, context: { sourcePath: string }) => {
		const run = (): void => {
			scheduleTableLayout(element, plugin.app, context.sourcePath);
		};

		run();

		const observer = new MutationObserver(run);
		observer.observe(element, { childList: true, subtree: true });
	};
}

function tableColumnLayoutEditorExtension(plugin: Plugin) {
	return ViewPlugin.fromClass(
		class {
			private observer: MutationObserver;

			constructor(private view: { dom: HTMLElement }) {
				this.observer = new MutationObserver(() => {
					this.instrumentTables();
				});
				this.observer.observe(this.view.dom, {
					childList: true,
					subtree: true,
				});
				void this.instrumentTables();
			}

			update(): void {
				void this.instrumentTables();
			}

			destroy(): void {
				this.observer.disconnect();
			}

			private instrumentTables(): void {
				const activeFile = plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return;
				}

				scheduleTableLayout(this.view.dom, plugin.app, activeFile.path);
			}
		},
	);
}

function resetTableLayoutFlags(container: ParentNode): void {
	for (const table of Array.from(
		container.querySelectorAll("table[data-nui-table-layout]"),
	)) {
		const el = table as HTMLElement;
		delete el.dataset.nuiTableLayout;
		el.classList.remove("nui-table-layout", "nui-table-all-shrink");
		for (const cell of Array.from(
			el.querySelectorAll(
				".nui-table-col-shrink, .nui-table-col-fill, .nui-table-align-left, .nui-table-align-center, .nui-table-align-right",
			),
		)) {
			cell.classList.remove(
				"nui-table-col-shrink",
				"nui-table-col-fill",
				"nui-table-align-left",
				"nui-table-align-center",
				"nui-table-align-right",
			);
		}
		for (const row of Array.from(
			el.querySelectorAll(".nui-table-phantom-separator"),
		)) {
			row.classList.remove("nui-table-phantom-separator");
		}
		el.querySelector("colgroup")?.remove();
	}
}

export function registerTableColumnLayout(plugin: Plugin): void {
	plugin.registerMarkdownPostProcessor(tableColumnLayoutPostProcessor(plugin));
	plugin.registerEditorExtension(
		createPreserveTableSeparatorRowsExtension(
			plugin.app,
			getSeparatorCanonicalStore,
			setSeparatorCanonicalStore,
		),
	);
	plugin.registerEditorExtension(tableColumnLayoutEditorExtension(plugin));
	registerSeparatorGuard(plugin);

	plugin.registerEvent(
		plugin.app.metadataCache.on("changed", (file: TFile) => {
			for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
				const view = leaf.view;
				if (!("file" in view)) {
					continue;
				}
				const markdownView = view as {
					file: TFile | null;
					containerEl?: HTMLElement;
				};
				if (markdownView.file?.path !== file.path) {
					continue;
				}
				const container = markdownView.containerEl?.querySelector(
					".markdown-reading-view, .markdown-source-view",
				);
				if (!container) {
					continue;
				}
				resetTableLayoutFlags(container);
				scheduleTableLayout(container, plugin.app, file.path);
			}
		}),
	);
}
