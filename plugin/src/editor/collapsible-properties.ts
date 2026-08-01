import { MarkdownView, type Plugin } from "obsidian";
import {
	contentSizers,
	findViewForElement,
	isOwnElement,
	isRawSourceView,
	mainMetadataContainer,
} from "./metadata-dom-utils";

const COLLAPSED_CLASS = "nui-properties-collapsed";
const ADD_CLASS = "nui-properties-add";
const TOGGLE_CLASS = "nui-properties-toggle";
const ROW_HEIGHT_VAR = "--nui-properties-row-height";

interface CollapsiblePropertiesPlugin extends Plugin {
	settings: { editor: { collapseProperties: boolean } };
	saveSettings(): Promise<void>;
}

interface AppCommands {
	commands: {
		executeCommandById(commandId: string): boolean;
	};
}

/** Publish each sizer's inline-title height so the collapsed icon can be
 * exactly as tall as the title and centre its glyph against it. CSS has no
 * way to reference a sibling's box, and centring in the grid row instead
 * would drop the icon by half the title's bottom margin. */
function publishTitleHeight(sizer: HTMLElement): void {
	const title = sizer.querySelector<HTMLElement>(":scope > .inline-title");
	const height = title?.getBoundingClientRect().height ?? 0;
	if (height > 0) {
		sizer.style.setProperty(ROW_HEIGHT_VAR, `${height}px`);
	} else {
		sizer.style.removeProperty(ROW_HEIGHT_VAR);
	}
}

function ownButtons(view: MarkdownView, className: string): HTMLElement[] {
	return Array.from(
		view.containerEl.querySelectorAll<HTMLElement>(`.${className}`),
	).filter((el) => isOwnElement(view, el));
}

export function registerCollapsibleProperties(
	plugin: CollapsiblePropertiesPlugin,
): () => void {
	let syncTimer: number | null = null;

	const isExpanded = (): boolean => !plugin.settings.editor.collapseProperties;

	const setCollapsed = (collapsed: boolean): void => {
		if (plugin.settings.editor.collapseProperties === collapsed) {
			return;
		}
		plugin.settings.editor.collapseProperties = collapsed;
		void plugin.saveSettings();
		syncAll();
	};

	const hasFileProperties = (view: MarkdownView): boolean => {
		if (!view.file) {
			return false;
		}
		const frontmatter =
			plugin.app.metadataCache.getFileCache(view.file)?.frontmatter;
		return (
			!!frontmatter &&
			Object.keys(frontmatter).some((key) => key !== "position")
		);
	};

	const clearButtons = (view: MarkdownView, className: string): void => {
		for (const button of ownButtons(view, className)) {
			button.remove();
		}
	};

	const syncTitleBarButton = (
		sizer: HTMLElement,
		className: string,
		ariaLabel: string,
	): void => {
		const existing = Array.from(
			sizer.querySelectorAll<HTMLElement>(`:scope > .${className}`),
		);
		for (const duplicate of existing.slice(1)) {
			duplicate.remove();
		}

		let button = existing[0];
		if (!button) {
			const created = document.createElement("button");
			created.type = "button";
			created.className = className;
			const title = sizer.querySelector<HTMLElement>(":scope > .inline-title");
			if (title) {
				title.after(created);
			} else {
				sizer.prepend(created);
			}
			button = created;
		}

		button.setAttribute("aria-label", ariaLabel);
	};

	/** With no frontmatter there is no `.metadata-container` to collapse, so
	 * the "add a property" affordance is our own button in the same slot. */
	const syncAddButtons = (view: MarkdownView): void => {
		for (const sizer of contentSizers(view)) {
			syncTitleBarButton(sizer, ADD_CLASS, "Add file property");
		}
	};

	/** When properties are visible, a hide button sits beside the title. */
	const syncToggleButtons = (view: MarkdownView): void => {
		for (const sizer of contentSizers(view)) {
			syncTitleBarButton(sizer, TOGGLE_CLASS, "Hide properties");
		}
	};

	const syncView = (view: MarkdownView): void => {
		const container = mainMetadataContainer(view);

		if (isRawSourceView(view)) {
			container?.classList.remove(COLLAPSED_CLASS);
			clearButtons(view, ADD_CLASS);
			clearButtons(view, TOGGLE_CLASS);
			return;
		}

		const expanded = isExpanded();
		const sizers = contentSizers(view);

		if (container) {
			container.classList.toggle(COLLAPSED_CLASS, !expanded);
			if (expanded) {
				container.removeAttribute("aria-expanded");
				container.removeAttribute("aria-label");
				clearButtons(view, ADD_CLASS);
				syncToggleButtons(view);
			} else {
				container.setAttribute("aria-expanded", "false");
				container.setAttribute("aria-label", "Show properties");
				clearButtons(view, TOGGLE_CLASS);
				clearButtons(view, ADD_CLASS);
			}
		} else if (hasFileProperties(view)) {
			// Obsidian is showing raw YAML under the cursor — leave it alone.
			clearButtons(view, ADD_CLASS);
			clearButtons(view, TOGGLE_CLASS);
		} else {
			// No properties yet: offer to add one.
			clearButtons(view, TOGGLE_CLASS);
			syncAddButtons(view);
		}

		for (const sizer of sizers) {
			publishTitleHeight(sizer);
			observeTitle(sizer);
		}
	};

	// The title's height changes when it wraps (pane resize, longer name), so
	// track the element itself rather than re-measuring on a timer.
	const observedTitles = new WeakSet<HTMLElement>();
	const titleResizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			const sizer = entry.target.parentElement;
			if (sizer) {
				publishTitleHeight(sizer);
			}
		}
	});

	const observeTitle = (sizer: HTMLElement): void => {
		const title = sizer.querySelector<HTMLElement>(":scope > .inline-title");
		if (title && !observedTitles.has(title)) {
			observedTitles.add(title);
			titleResizeObserver.observe(title);
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
		}, 0);
	};

	const findViewForElementLocal = (element: Element): MarkdownView | null =>
		findViewForElement(plugin.app, element);

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", scheduleSync),
	);
	plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("file-open", scheduleSync));
	plugin.registerEvent(plugin.app.metadataCache.on("changed", scheduleSync));

	// Tabbing or clicking into a property expands, so the fields are reachable.
	plugin.registerDomEvent(document, "focusin", (evt) => {
		const target = evt.target;
		if (!(target instanceof Element)) {
			return;
		}
		const container = target.closest<HTMLElement>(".metadata-container");
		if (!container) {
			return;
		}
		const view = findViewForElementLocal(container);
		if (view) {
			setCollapsed(false);
		}
	});

	plugin.registerDomEvent(
		document,
		"pointerdown",
		(evt) => {
			const target = evt.target;
			if (!(target instanceof Element)) {
				return;
			}

			const addButton = target.closest(`.${ADD_CLASS}`);
			if (addButton) {
				evt.preventDefault();
				evt.stopPropagation();
				const view = findViewForElementLocal(addButton);
				if (view) {
					setCollapsed(false);
					(plugin.app as unknown as AppCommands).commands.executeCommandById(
						"markdown:add-metadata-property",
					);
					scheduleSync();
				}
				return;
			}

			const toggleButton = target.closest(`.${TOGGLE_CLASS}`);
			if (toggleButton) {
				evt.preventDefault();
				evt.stopPropagation();
				setCollapsed(true);
				return;
			}

			const collapsed = target.closest(`.metadata-container.${COLLAPSED_CLASS}`);
			if (collapsed) {
				evt.preventDefault();
				evt.stopPropagation();
				setCollapsed(false);
			}
		},
		true,
	);

	const observer = new MutationObserver(scheduleSync);
	observer.observe(document.body, { childList: true, subtree: true });

	plugin.register(() => {
		observer.disconnect();
		titleResizeObserver.disconnect();
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}
		for (const sizer of Array.from(
			document.querySelectorAll<HTMLElement>(".cm-sizer, .markdown-preview-sizer"),
		)) {
			sizer.style.removeProperty(ROW_HEIGHT_VAR);
		}
		for (const className of [ADD_CLASS, TOGGLE_CLASS]) {
			for (const button of Array.from(
				document.querySelectorAll<HTMLElement>(`.${className}`),
			)) {
				button.remove();
			}
		}
		for (const container of Array.from(
			document.querySelectorAll<HTMLElement>(".metadata-container"),
		)) {
			container.classList.remove(COLLAPSED_CLASS);
			container.removeAttribute("aria-expanded");
			container.removeAttribute("aria-label");
		}
	});

	scheduleSync();
	return syncAll;
}
