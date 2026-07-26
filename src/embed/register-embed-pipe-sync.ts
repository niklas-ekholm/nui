import { MarkdownView, type Plugin } from "obsidian";
import {
	syncEmbedPipesInActiveLeaf,
	syncEmbedPipesInElement,
} from "./embed-pipe-sync";
import { registerPaneWidthSync } from "./sync-pane-width";

export function registerEmbedPipeSync(plugin: Plugin): void {
	let syncTimer: number | null = null;

	const syncAllMarkdownViews = (): void => {
		for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView) || !view.file) continue;
			syncEmbedPipesInElement(
				plugin.app,
				view.file.path,
				view.containerEl,
			);
		}
	};

	const scheduleSync = (): void => {
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}

		syncTimer = window.setTimeout(() => {
			syncTimer = null;
			requestAnimationFrame(() => {
				syncAllMarkdownViews();
				syncEmbedPipesInActiveLeaf(plugin.app);
			});
		}, 0);
	};

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.metadataCache.on("changed", (file) => {
			for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
				const view = leaf.view;
				if (view instanceof MarkdownView && view.file?.path === file.path) {
					scheduleSync();
					return;
				}
			}
		}),
	);

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of Array.from(record.addedNodes)) {
				if (
					node instanceof HTMLElement &&
					(node.matches(EMBED_SELECTOR) ||
						node.querySelector(EMBED_SELECTOR) ||
						node.matches(".nui-timeline-bases-root, .nui-timeline") ||
						node.querySelector(".nui-timeline-bases-root, .nui-timeline"))
				) {
					scheduleSync();
					return;
				}
			}
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
	plugin.register(() => observer.disconnect());

	scheduleSync();
	registerPaneWidthSync(plugin);
}

const EMBED_SELECTOR =
	".internal-embed, .block-language-base.bases-embed, .image-embed img";
