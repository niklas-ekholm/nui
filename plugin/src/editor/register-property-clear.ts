import { MarkdownView, type Plugin, type TFile } from "obsidian";
import {
	findViewForElement,
	readPropertyKey,
	topLevelPropertyRows,
} from "./metadata-dom-utils";

const CLEAR_CLASS = "nui-property-clear";

function getFileForPropertyEl(
	plugin: Plugin,
	propertyEl: HTMLElement,
): TFile | null {
	const view = findViewForElement(plugin.app, propertyEl);
	if (view instanceof MarkdownView && view.file) {
		return view.file;
	}
	return plugin.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null;
}

async function clearProperty(
	plugin: Plugin,
	propertyEl: HTMLElement,
): Promise<void> {
	const key = readPropertyKey(propertyEl);
	if (!key) {
		return;
	}

	const file = getFileForPropertyEl(plugin, propertyEl);
	if (!file) {
		return;
	}

	await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
		delete (frontmatter as Record<string, unknown>)[key];
	});
}

function ensureClearButton(
	plugin: Plugin,
	propertyEl: HTMLElement,
): void {
	const key = readPropertyKey(propertyEl);
	let button = propertyEl.querySelector<HTMLButtonElement>(
		`:scope > .${CLEAR_CLASS}`,
	);

	if (!key) {
		button?.remove();
		return;
	}

	if (!button) {
		button = document.createElement("button");
		button.type = "button";
		button.className = CLEAR_CLASS;
		button.textContent = "×";
		button.setAttribute("aria-label", "Clear property");
		button.title = "Clear property";
		button.tabIndex = -1;
		button.addEventListener("mousedown", (evt) => {
			// Keep focus in the property field; avoid stealing edit state.
			evt.preventDefault();
		});
		button.addEventListener("click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			void clearProperty(plugin, propertyEl);
		});
		propertyEl.appendChild(button);
	}
}

function syncPropertyClearButtons(plugin: Plugin): void {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		if (!(leaf.view instanceof MarkdownView)) {
			continue;
		}
		for (const container of Array.from(
			leaf.view.containerEl.querySelectorAll<HTMLElement>(
				".metadata-container",
			),
		)) {
			if (container.closest(".internal-embed")) {
				continue;
			}
			for (const propertyEl of topLevelPropertyRows(container)) {
				ensureClearButton(plugin, propertyEl);
			}
		}
	}
}

export function registerPropertyClear(plugin: Plugin): void {
	let syncTimer: number | null = null;
	let syncing = false;

	const scheduleSync = (): void => {
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}
		syncTimer = window.setTimeout(() => {
			syncTimer = null;
			syncing = true;
			try {
				syncPropertyClearButtons(plugin);
			} finally {
				syncing = false;
			}
		}, 50);
	};

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", scheduleSync),
	);
	plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("file-open", scheduleSync));
	plugin.registerEvent(plugin.app.metadataCache.on("changed", scheduleSync));

	const observer = new MutationObserver(() => {
		if (syncing) {
			return;
		}
		scheduleSync();
	});
	observer.observe(document.body, { childList: true, subtree: true });
	plugin.register(() => {
		observer.disconnect();
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}
		for (const button of Array.from(
			document.querySelectorAll<HTMLElement>(`.${CLEAR_CLASS}`),
		)) {
			button.remove();
		}
	});

	scheduleSync();
}
