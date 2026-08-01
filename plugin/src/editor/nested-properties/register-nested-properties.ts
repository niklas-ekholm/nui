import { MarkdownView, type Plugin } from "obsidian";
import {
	findViewForElement,
	isOwnElement,
	isRawSourceView,
	mainMetadataContainer,
	topLevelPropertyRows,
} from "../metadata-dom-utils";
import { isComplexValue } from "./frontmatter-mutate";
import {
	clearNestedEnhancements,
	DONE_ATTR,
	enhanceComplexPropertyRow,
	injectHeaderActions,
	markNestedDone,
	type RenderContext,
} from "./render-tree";

const PLUGIN_ID = "nui";

interface NestedPropertiesSettings {
	editor: {
		nestedProperties: boolean;
		nestedPropertiesDefaultCollapsed: boolean;
	};
}

export function registerNestedProperties(
	plugin: Plugin & {
		settings: NestedPropertiesSettings;
		saveSettings(): Promise<void>;
	},
): () => void {
	let syncTimer: number | null = null;

	const syncView = (view: MarkdownView): void => {
		if (!plugin.settings.editor.nestedProperties) {
			return;
		}
		if (isRawSourceView(view) || !view.file) {
			return;
		}

		const container = mainMetadataContainer(view);
		if (!container || !isOwnElement(view, container)) {
			return;
		}

		if (container.hasAttribute(DONE_ATTR)) {
			return;
		}

		const frontmatter = plugin.app.metadataCache.getFileCache(view.file)
			?.frontmatter as Record<string, unknown> | undefined;
		if (!frontmatter) {
			return;
		}

		const ctx: RenderContext = {
			app: plugin.app,
			file: view.file,
			defaultCollapsed:
				plugin.settings.editor.nestedPropertiesDefaultCollapsed,
		};

		let enhanced = false;
		for (const row of topLevelPropertyRows(container)) {
			const key = row.querySelector<HTMLInputElement>(
				":scope > .metadata-property-key .metadata-property-key-input",
			)?.value.trim();
			if (!key || key === "position") {
				continue;
			}
			const value = frontmatter[key];
			if (!isComplexValue(value)) {
				continue;
			}
			enhanceComplexPropertyRow(ctx, row, key, value);
			row.setAttribute("data-nui-path", key);
			enhanced = true;
		}

		if (enhanced) {
			markNestedDone(container, PLUGIN_ID);
			injectHeaderActions(container);
		}
	};

	const syncAll = (): void => {
		for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
			if (leaf.view instanceof MarkdownView) {
				syncView(leaf.view);
			}
		}
	};

	const scheduleSync = (): void => {
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}
		syncTimer = window.setTimeout(() => {
			syncTimer = null;
			syncAll();
		}, 50);
	};

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			const target = mutation.target;
			if (!(target instanceof HTMLElement)) {
				continue;
			}
			const container = target.closest(".metadata-container");
			if (container instanceof HTMLElement && container.hasAttribute(DONE_ATTR)) {
				const hadNested = mutation.removedNodes.length > 0;
				if (hadNested) {
					container.removeAttribute(DONE_ATTR);
				}
			}
		}
		scheduleSync();
	});

	observer.observe(document.body, { childList: true, subtree: true });

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", scheduleSync),
	);
	plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("file-open", scheduleSync));
	plugin.registerEvent(plugin.app.metadataCache.on("changed", scheduleSync));
	plugin.registerEvent(plugin.app.metadataCache.on("resolve", scheduleSync));

	plugin.registerDomEvent(document, "focusin", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}
		const container = target.closest(".metadata-container");
		if (!container) {
			return;
		}
		findViewForElement(plugin.app, container);
		scheduleSync();
	});

	plugin.register(() => {
		observer.disconnect();
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}
		for (const container of Array.from(
			document.querySelectorAll<HTMLElement>(".metadata-container"),
		)) {
			clearNestedEnhancements(container);
		}
	});

	scheduleSync();
	return syncAll;
}
