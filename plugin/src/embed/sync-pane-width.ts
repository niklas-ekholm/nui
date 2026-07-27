import type { Plugin } from "obsidian";
import { MarkdownView } from "obsidian";

const PANE_SELECTOR = ".view-content, .cm-scroller";

function findPaneRoot(containerEl: HTMLElement): HTMLElement | null {
	return containerEl.querySelector<HTMLElement>(PANE_SELECTOR);
}

export function syncPaneWidthForPane(
	pane: HTMLElement,
	widthOverride?: number,
): void {
	const hasWide = pane.querySelector("[data-nui-embed-wide]");
	if (!hasWide) {
		pane.style.removeProperty("--nui-pane-width");
		return;
	}

	const width = widthOverride ?? pane.clientWidth;
	if (width > 0) {
		pane.style.setProperty("--nui-pane-width", `${width}px`);
	}
}

export function syncPaneWidthInElement(containerEl: HTMLElement): void {
	const pane = findPaneRoot(containerEl);
	if (!pane) return;
	syncPaneWidthForPane(pane);
}

export function syncPaneWidthInAllMarkdownViews(app: Plugin["app"]): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		syncPaneWidthInElement(view.containerEl);
	}
}

const paneObservers = new WeakMap<HTMLElement, ResizeObserver>();

function ensurePaneObserver(pane: HTMLElement): void {
	if (paneObservers.has(pane)) return;

	const observer = new ResizeObserver((entries) => {
		for (const entry of entries) {
			const target = entry.target;
			if (!(target instanceof HTMLElement)) continue;
			const width = entry.contentRect.width;
			requestAnimationFrame(() => syncPaneWidthForPane(target, width));
		}
	});
	observer.observe(pane);
	paneObservers.set(pane, observer);
}

function ensureAllPaneObservers(app: Plugin["app"]): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		const pane = findPaneRoot(view.containerEl);
		if (pane) ensurePaneObserver(pane);
	}
}

export function registerPaneWidthSync(plugin: Plugin): void {
	const sync = (): void => {
		requestAnimationFrame(() => {
			ensureAllPaneObservers(plugin.app);
			syncPaneWidthInAllMarkdownViews(plugin.app);
		});
	};

	ensureAllPaneObservers(plugin.app);
	plugin.registerEvent(plugin.app.workspace.on("layout-change", sync));
	plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", sync));
	plugin.registerDomEvent(window, "resize", sync);

	sync();
}
