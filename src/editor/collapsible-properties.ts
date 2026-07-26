import { MarkdownView, setIcon, type Plugin } from "obsidian";

const TOGGLE_CLASS = "nui-properties-toggle";
const COLLAPSED_CLASS = "nui-properties-collapsed";

interface PropertiesState {
	filePath: string | null;
	expanded: boolean;
}

interface AppCommands {
	commands: {
		executeCommandById(commandId: string): boolean;
	};
}

function isMainPropertiesContainer(
	view: MarkdownView,
	el: HTMLElement,
): boolean {
	return view.containerEl.contains(el) && !el.closest(".internal-embed");
}

function applyPropertiesState(
	view: MarkdownView,
	state: PropertiesState,
): void {
	for (const metadataEl of Array.from(
		view.containerEl.querySelectorAll<HTMLElement>(".metadata-container"),
	)) {
		if (!isMainPropertiesContainer(view, metadataEl)) {
			continue;
		}

		metadataEl.classList.toggle(COLLAPSED_CLASS, !state.expanded);
		const toggle = metadataEl.previousElementSibling;
		if (toggle instanceof HTMLButtonElement && toggle.classList.contains(TOGGLE_CLASS)) {
			toggle.setAttribute("aria-expanded", String(state.expanded));
			toggle.setAttribute(
				"aria-label",
				state.expanded ? "Hide properties" : "Show properties",
			);
		}
	}
}

export function registerCollapsibleProperties(plugin: Plugin): void {
	const states = new WeakMap<MarkdownView, PropertiesState>();
	const expandedViews = new Set<MarkdownView>();
	let toggleId = 0;
	let syncTimer: number | null = null;

	const getState = (view: MarkdownView): PropertiesState => {
		const filePath = view.file?.path ?? null;
		const existing = states.get(view);
		if (existing?.filePath === filePath) {
			return existing;
		}

		const state = { filePath, expanded: false };
		states.set(view, state);
		expandedViews.delete(view);
		return state;
	};

	const setExpanded = (view: MarkdownView, expanded: boolean): void => {
		const state = getState(view);
		state.expanded = expanded;
		if (expanded) {
			expandedViews.add(view);
		} else {
			expandedViews.delete(view);
		}
		applyPropertiesState(view, state);
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

	const hasFileProperties = (view: MarkdownView): boolean => {
		if (!view.file) {
			return false;
		}
		const frontmatter =
			plugin.app.metadataCache.getFileCache(view.file)?.frontmatter;
		return !!frontmatter &&
			Object.keys(frontmatter).some((key) => key !== "position");
	};

	const createToggle = (view: MarkdownView): HTMLButtonElement => {
		const toggle = document.createElement("button");
		toggle.type = "button";
		toggle.className = `${TOGGLE_CLASS} clickable-icon metadata-property-icon`;
		toggle.id = `nui-properties-toggle-${++toggleId}`;

		const activate = (): void => {
			if (!hasFileProperties(view)) {
				setExpanded(view, true);
				(plugin.app as unknown as AppCommands).commands.executeCommandById(
					"markdown:add-metadata-property",
				);
				scheduleSync();
				return;
			}
			setExpanded(view, !getState(view).expanded);
		};

		toggle.addEventListener("pointerdown", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			activate();
		});
		toggle.addEventListener("keydown", (evt) => {
			if (evt.key !== "Enter" && evt.key !== " ") {
				return;
			}
			evt.preventDefault();
			evt.stopPropagation();
			activate();
		});
		return toggle;
	};

	const findToggleMount = (view: MarkdownView): HTMLElement | null =>
		view.containerEl.querySelector<HTMLElement>(
			".markdown-source-view.mod-cm6 .cm-sizer, .markdown-preview-view .markdown-preview-sizer, .markdown-reading-view .markdown-preview-sizer",
		);

	const syncView = (view: MarkdownView): void => {
		const state = getState(view);
		const existingToggles = Array.from(
			view.containerEl.querySelectorAll<HTMLElement>(`.${TOGGLE_CLASS}`),
		).filter((toggle) => !toggle.closest(".internal-embed"));
		const metadataEl = Array.from(
			view.containerEl.querySelectorAll<HTMLElement>(".metadata-container"),
		).find((el) => isMainPropertiesContainer(view, el));
		const hasProperties = hasFileProperties(view);

		// When Obsidian exposes the raw YAML under the text cursor, the metadata
		// widget is absent and the frontmatter is already visible.
		if (!metadataEl && hasProperties) {
			for (const toggle of existingToggles) {
				toggle.remove();
			}
			return;
		}

		let toggle = existingToggles[0];
		if (!(toggle instanceof HTMLButtonElement)) {
			toggle = createToggle(view);
		}
		for (const duplicate of existingToggles.slice(1)) {
			duplicate.remove();
		}

		if (metadataEl) {
			if (toggle.nextElementSibling !== metadataEl) {
				metadataEl.before(toggle);
			}
			metadataEl.setAttribute("aria-labelledby", toggle.id);
		} else {
			const mount = findToggleMount(view);
			if (!mount) {
				toggle.remove();
				return;
			}
			if (toggle.parentElement !== mount) {
				mount.prepend(toggle);
			}
		}

		const mode = hasProperties ? "properties" : "add";
		if (toggle.dataset.nuiPropertiesMode !== mode) {
			toggle.dataset.nuiPropertiesMode = mode;
			setIcon(toggle, hasProperties ? "text" : "plus");
		}
		toggle.setAttribute(
			"aria-label",
			hasProperties
				? state.expanded
					? "Hide properties"
					: "Show properties"
				: "Add file property",
		);
		toggle.setAttribute(
			"aria-expanded",
			hasProperties ? String(state.expanded) : "false",
		);
		applyPropertiesState(view, state);
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

	plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("file-open", scheduleSync));
	plugin.registerEvent(plugin.app.metadataCache.on("changed", scheduleSync));

	plugin.registerDomEvent(document, "focusin", (evt) => {
		const target = evt.target;
		if (!(target instanceof Element)) {
			return;
		}
		const metadataEl = target.closest<HTMLElement>(".metadata-container");
		if (!metadataEl) {
			return;
		}
		const view = findViewForElement(metadataEl);
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
			if (
				target.closest(
					`.${TOGGLE_CLASS}, .metadata-container, .suggestion-container, .menu, .popover, .modal-container`,
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
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}
		for (const toggle of Array.from(
			document.querySelectorAll<HTMLElement>(`.${TOGGLE_CLASS}`),
		)) {
			toggle.remove();
		}
		for (const metadataEl of Array.from(
			document.querySelectorAll<HTMLElement>(".metadata-container"),
		)) {
			metadataEl.classList.remove(COLLAPSED_CLASS);
			metadataEl.removeAttribute("aria-labelledby");
		}
	});

	scheduleSync();
}
