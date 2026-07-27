import { MarkdownView, type Plugin } from "obsidian";

const COLLAPSED_CLASS = "nui-properties-collapsed";
const ADD_CLASS = "nui-properties-add";
const ROW_HEIGHT_VAR = "--nui-properties-row-height";

interface PropertiesState {
	filePath: string | null;
	expanded: boolean;
}

interface AppCommands {
	commands: {
		executeCommandById(commandId: string): boolean;
	};
}

/** The view's own elements, never one belonging to an embedded note. */
function isOwnElement(view: MarkdownView, el: Element): boolean {
	return view.containerEl.contains(el) && !el.closest(".internal-embed");
}

function mainMetadataContainer(view: MarkdownView): HTMLElement | null {
	return (
		Array.from(
			view.containerEl.querySelectorAll<HTMLElement>(".metadata-container"),
		).find((el) => isOwnElement(view, el)) ?? null
	);
}

/** Live-preview and reading-view content wrappers — the shared parent of
 * `.inline-title` and `.metadata-container` in each mode. */
function contentSizers(view: MarkdownView): HTMLElement[] {
	return Array.from(
		view.containerEl.querySelectorAll<HTMLElement>(
			".cm-sizer, .markdown-preview-sizer",
		),
	).filter((el) => isOwnElement(view, el));
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

function ownAddButtons(view: MarkdownView): HTMLElement[] {
	return Array.from(
		view.containerEl.querySelectorAll<HTMLElement>(`.${ADD_CLASS}`),
	).filter((el) => isOwnElement(view, el));
}

/** Strict Source mode (not live preview) shows frontmatter as plain text —
 * there is no properties widget to collapse, and nothing to hide. */
function isRawSourceView(view: MarkdownView): boolean {
	const state = view.getState() as { mode?: string; source?: boolean };
	return state.mode === "source" && state.source === true;
}

export function registerCollapsibleProperties(plugin: Plugin): void {
	const states = new WeakMap<MarkdownView, PropertiesState>();
	const expandedViews = new Set<MarkdownView>();
	let syncTimer: number | null = null;

	const getState = (view: MarkdownView): PropertiesState => {
		const filePath = view.file?.path ?? null;
		const existing = states.get(view);
		if (existing?.filePath === filePath) {
			return existing;
		}

		// A new file starts collapsed.
		const state = { filePath, expanded: false };
		states.set(view, state);
		expandedViews.delete(view);
		return state;
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

	const clearAddButtons = (view: MarkdownView): void => {
		for (const button of ownAddButtons(view)) {
			button.remove();
		}
	};

	/** With no frontmatter there is no `.metadata-container` to collapse, so
	 * the "add a property" affordance is our own button in the same slot. */
	const syncAddButtons = (view: MarkdownView): void => {
		for (const sizer of contentSizers(view)) {
			const existing = Array.from(
				sizer.querySelectorAll<HTMLElement>(`:scope > .${ADD_CLASS}`),
			);
			for (const duplicate of existing.slice(1)) {
				duplicate.remove();
			}
			if (existing.length > 0) {
				continue;
			}

			const button = document.createElement("button");
			button.type = "button";
			button.className = ADD_CLASS;
			button.setAttribute("aria-label", "Add file property");

			const title = sizer.querySelector<HTMLElement>(":scope > .inline-title");
			if (title) {
				title.after(button);
			} else {
				sizer.prepend(button);
			}
		}
	};

	const syncView = (view: MarkdownView): void => {
		const container = mainMetadataContainer(view);

		if (isRawSourceView(view)) {
			container?.classList.remove(COLLAPSED_CLASS);
			clearAddButtons(view);
			return;
		}

		const state = getState(view);
		const sizers = contentSizers(view);

		if (container) {
			container.classList.toggle(COLLAPSED_CLASS, !state.expanded);
			container.setAttribute("aria-expanded", String(state.expanded));
			container.setAttribute(
				"aria-label",
				state.expanded ? "Hide properties" : "Show properties",
			);
			clearAddButtons(view);
		} else if (hasFileProperties(view)) {
			// Obsidian is showing raw YAML under the cursor — leave it alone.
			clearAddButtons(view);
		} else {
			// No properties yet: offer to add one.
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

	const setExpanded = (view: MarkdownView, expanded: boolean): void => {
		const state = getState(view);
		state.expanded = expanded;
		if (expanded) {
			expandedViews.add(view);
		} else {
			expandedViews.delete(view);
		}
		syncView(view);
	};

	const findViewForElement = (element: Element): MarkdownView | null => {
		for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
			if (
				leaf.view instanceof MarkdownView &&
				leaf.view.containerEl.contains(element)
			) {
				return leaf.view;
			}
		}
		return null;
	};

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
		const view = findViewForElement(container);
		if (view) {
			setExpanded(view, true);
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
				const view = findViewForElement(addButton);
				if (view) {
					setExpanded(view, true);
					(plugin.app as unknown as AppCommands).commands.executeCommandById(
						"markdown:add-metadata-property",
					);
					scheduleSync();
				}
				return;
			}

			const collapsed = target.closest(`.metadata-container.${COLLAPSED_CLASS}`);
			if (collapsed) {
				evt.preventDefault();
				evt.stopPropagation();
				const view = findViewForElement(collapsed);
				if (view) {
					setExpanded(view, true);
				}
				return;
			}

			if (
				target.closest(
					".metadata-container, .suggestion-container, .menu, .popover, .modal-container",
				)
			) {
				return;
			}

			for (const view of Array.from(expandedViews)) {
				setExpanded(view, false);
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
		for (const button of Array.from(
			document.querySelectorAll<HTMLElement>(`.${ADD_CLASS}`),
		)) {
			button.remove();
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
}
