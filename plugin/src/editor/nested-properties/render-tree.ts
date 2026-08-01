import { setIcon, type App, type TFile } from "obsidian";
import {
	isComplexValue,
	setNestedValue,
} from "./frontmatter-mutate";
import { formatSummary } from "./summary";

const CONTAINER_CLASS = "nui-nested-container";
const COLLAPSIBLE_CLASS = "nui-nested-collapsible";
const COLLAPSED_CLASS = "is-collapsed";
const SUMMARY_CLASS = "nui-nested-summary";
const COLLAPSE_BTN_CLASS = "nui-nested-collapse-btn";
const HEADER_ACTIONS_CLASS = "nui-nested-header-actions";
const DONE_ATTR = "data-nui-nested-done";

export interface RenderContext {
	app: App;
	file: TFile;
	defaultCollapsed: boolean;
}

const expandedPaths = new Set<string>();

function pathKey(segments: string[]): string {
	return segments.join(".");
}

function uniqueObjectKey(obj: Record<string, unknown>, base = "key"): string {
	let key = base;
	let n = 2;
	while (Object.prototype.hasOwnProperty.call(obj, key)) {
		key = `${base}_${n}`;
		n += 1;
	}
	return key;
}

function defaultArrayItem(arr: unknown[]): unknown {
	if (arr.length === 0) {
		return "";
	}
	const sample = arr[arr.length - 1];
	if (Array.isArray(sample)) {
		return [];
	}
	if (sample !== null && typeof sample === "object") {
		return {};
	}
	return "";
}

function appendAddButton(
	container: HTMLElement,
	ariaLabel: string,
	onAdd: () => void,
): void {
	const button = container.createEl("button", {
		cls: "metadata-add-button",
		attr: { type: "button", "aria-label": ariaLabel },
	});
	button.createSpan({ cls: "text-button-label", text: ariaLabel });
	setIcon(button, "plus");
	button.addEventListener("click", (event) => {
		event.stopPropagation();
		event.preventDefault();
		onAdd();
	});
}

function scalarInput(
	parent: HTMLElement,
	value: unknown,
	onChange: (next: unknown) => void,
): void {
	const input = parent.createEl("input", {
		cls: "nui-nested-scalar-input",
		type: "text",
		value: value === null || value === undefined ? "" : String(value),
	});
	input.addEventListener("keydown", (event) => event.stopPropagation());
	input.addEventListener("change", () => {
		const raw = input.value.trim();
		if (raw === "") {
			onChange(undefined);
			return;
		}
		if (raw === "true" || raw === "false") {
			onChange(raw === "true");
			return;
		}
		const asNumber = Number(raw);
		if (!Number.isNaN(asNumber) && /^-?\d+(\.\d+)?$/.test(raw)) {
			onChange(asNumber);
			return;
		}
		onChange(raw);
	});
}

function syncToggleAllButton(container: ParentNode): void {
	const actions = container.querySelector<HTMLElement>(
		`.${HEADER_ACTIONS_CLASS}`,
	);
	const toggle = actions?.querySelector<HTMLElement>(".nui-nested-toggle-all");
	if (!toggle) {
		return;
	}
	const collapsibles = container.querySelectorAll<HTMLElement>(
		`.${COLLAPSIBLE_CLASS}`,
	);
	const allCollapsed =
		collapsibles.length > 0 &&
		Array.from(collapsibles).every((el) =>
			el.classList.contains(COLLAPSED_CLASS),
		);
	toggle.setAttribute(
		"aria-label",
		allCollapsed
			? "Expand all nested properties"
			: "Collapse all nested properties",
	);
	toggle.empty();
	setIcon(toggle, allCollapsed ? "chevrons-up-down" : "chevrons-down-up");
}

function ensureCollapseButton(
	keyEl: HTMLElement,
	propertyEl: HTMLElement,
	path: string,
	defaultCollapsed: boolean,
): void {
	if (keyEl.querySelector(`.${COLLAPSE_BTN_CLASS}`)) {
		return;
	}
	const collapseBtn = document.createElement("div");
	collapseBtn.className = COLLAPSE_BTN_CLASS;
	keyEl.insertBefore(collapseBtn, keyEl.firstChild);
	setIcon(collapseBtn, "right-triangle");
	const expanded = expandedPaths.has(path) || !defaultCollapsed;
	propertyEl.classList.toggle(COLLAPSED_CLASS, !expanded);
	if (expanded) {
		expandedPaths.add(path);
	}
	collapseBtn.addEventListener("click", (event) => {
		event.stopPropagation();
		event.preventDefault();
		const collapsed = propertyEl.classList.toggle(COLLAPSED_CLASS);
		if (collapsed) {
			expandedPaths.delete(path);
		} else {
			expandedPaths.add(path);
		}
		const container = propertyEl.closest(".metadata-container");
		if (container) {
			syncToggleAllButton(container);
		}
	});
}

function ensureSummary(
	valueEl: HTMLElement,
	value: unknown,
	propertyEl: HTMLElement,
): void {
	let summary = valueEl.querySelector<HTMLElement>(`.${SUMMARY_CLASS}`);
	if (!summary) {
		summary = valueEl.createDiv({ cls: SUMMARY_CLASS });
		summary.addEventListener("click", (event) => {
			event.stopPropagation();
			propertyEl.classList.remove(COLLAPSED_CLASS);
		});
	}
	summary.setText(formatSummary(value));
}

function renderEntry(
	ctx: RenderContext,
	container: HTMLElement,
	label: string,
	value: unknown,
	parentPath: string[],
	onValueChange: (next: unknown) => void,
): void {
	const segments = [...parentPath, label];
	const path = pathKey(segments);
	const propertyEl = container.createDiv({
		cls: ["metadata-property", COLLAPSIBLE_CLASS],
		attr: { "data-nui-path": path },
	});

	const keyEl = propertyEl.createDiv({ cls: "metadata-property-key" });
	ensureCollapseButton(keyEl, propertyEl, path, ctx.defaultCollapsed);
	keyEl.createSpan({ cls: "metadata-property-icon" });
	const keyInput = keyEl.createEl("input", {
		cls: "metadata-property-key-input",
		attr: { readonly: "", tabindex: "-1" },
		value: label,
	});
	keyInput.size = Math.max(1, label.length);

	const valueEl = propertyEl.createDiv({ cls: "metadata-property-value" });
	ensureSummary(valueEl, value, propertyEl);

	if (isComplexValue(value)) {
		const nested = valueEl.createDiv({ cls: CONTAINER_CLASS });
		renderNestedValue(ctx, nested, value, segments, onValueChange);
		return;
	}

	scalarInput(valueEl, value, onValueChange);
}

function renderArray(
	ctx: RenderContext,
	container: HTMLElement,
	arr: unknown[],
	parentPath: string[],
	onArrayChange: (next: unknown[]) => void,
): void {
	arr.forEach((item, index) => {
		renderEntry(
			ctx,
			container,
			String(index),
			item,
			parentPath,
			(next) => {
				const copy = [...arr];
				copy[index] = next;
				onArrayChange(copy);
			},
		);
	});
	appendAddButton(container, "Add array item", () => {
		onArrayChange([...arr, defaultArrayItem(arr)]);
	});
}

function renderObject(
	ctx: RenderContext,
	container: HTMLElement,
	obj: Record<string, unknown>,
	parentPath: string[],
	onObjectChange: (next: Record<string, unknown>) => void,
): void {
	for (const [key, val] of Object.entries(obj)) {
		renderEntry(ctx, container, key, val, parentPath, (next) => {
			const copy = { ...obj, [key]: next };
			onObjectChange(copy);
		});
	}
	appendAddButton(container, "Add nested property", () => {
		const newKey = uniqueObjectKey(obj);
		onObjectChange({ ...obj, [newKey]: "" });
	});
}

function renderNestedValue(
	ctx: RenderContext,
	container: HTMLElement,
	value: unknown,
	parentPath: string[],
	onValueChange: (next: unknown) => void,
): void {
	const persist = (next: unknown): void => {
		onValueChange(next);
		void persistChange(ctx, parentPath, next);
	};
	if (Array.isArray(value)) {
		renderArray(ctx, container, value, parentPath, persist);
		return;
	}
	if (isComplexValue(value)) {
		renderObject(
			ctx,
			container,
			value as Record<string, unknown>,
			parentPath,
			(next) => persist(next),
		);
	}
}

async function persistChange(
	ctx: RenderContext,
	path: string[],
	value: unknown,
): Promise<void> {
	await setNestedValue(ctx.app, ctx.file, path, value);
}

export function enhanceComplexPropertyRow(
	ctx: RenderContext,
	propertyEl: HTMLElement,
	key: string,
	value: unknown,
): void {
	if (!isComplexValue(value)) {
		return;
	}
	const valueEl = propertyEl.querySelector<HTMLElement>(
		":scope > .metadata-property-value",
	);
	if (!valueEl || valueEl.querySelector(`.${CONTAINER_CLASS}`)) {
		return;
	}

	propertyEl.classList.add(COLLAPSIBLE_CLASS);
	const keyEl = propertyEl.querySelector<HTMLElement>(
		":scope > .metadata-property-key",
	);
	if (keyEl) {
		ensureCollapseButton(keyEl, propertyEl, key, ctx.defaultCollapsed);
	}

	valueEl.empty();
	ensureSummary(valueEl, value, propertyEl);
	const nested = valueEl.createDiv({ cls: CONTAINER_CLASS });
	renderNestedValue(ctx, nested, value, [key], (next) => {
		void persistChange(ctx, [key], next);
	});
}

export function injectHeaderActions(container: HTMLElement): void {
	if (container.querySelector(`.${HEADER_ACTIONS_CLASS}`)) {
		syncToggleAllButton(container);
		return;
	}
	const heading = container.querySelector(".metadata-properties-heading");
	if (!heading) {
		return;
	}
	const actions = heading.createDiv({ cls: HEADER_ACTIONS_CLASS });
	const toggle = actions.createEl("button", {
		cls: "nui-nested-toggle-all",
		attr: { type: "button" },
	});
	syncToggleAllButton(container);
	toggle.addEventListener("click", (event) => {
		event.stopPropagation();
		const collapsibles = container.querySelectorAll<HTMLElement>(
			`.${COLLAPSIBLE_CLASS}`,
		);
		const allCollapsed = Array.from(collapsibles).every((el) =>
			el.classList.contains(COLLAPSED_CLASS),
		);
		for (const el of Array.from(collapsibles)) {
			el.classList.toggle(COLLAPSED_CLASS, !allCollapsed);
			const path = el.getAttribute("data-nui-path");
			if (path) {
				if (!allCollapsed) {
					expandedPaths.add(path);
				} else {
					expandedPaths.delete(path);
				}
			}
		}
		const topLevel = Array.from(
			container.querySelectorAll<HTMLElement>(
				`:scope .metadata-properties > .${COLLAPSIBLE_CLASS}`,
			),
		);
		for (const el of topLevel) {
			const keyInput = el.querySelector<HTMLInputElement>(
				".metadata-property-key-input",
			);
			const key = keyInput?.value.trim();
			if (key) {
				if (!allCollapsed) {
					expandedPaths.add(key);
				} else {
					expandedPaths.delete(key);
				}
			}
		}
		syncToggleAllButton(container);
	});
}

export function refreshHeaderToggle(container: HTMLElement): void {
	if (container.querySelector(`.${HEADER_ACTIONS_CLASS}`)) {
		syncToggleAllButton(container);
	}
}

export function markNestedDone(container: HTMLElement, pluginId: string): boolean {
	if (container.hasAttribute(DONE_ATTR)) {
		return false;
	}
	container.setAttribute(DONE_ATTR, pluginId);
	return true;
}

export function clearNestedEnhancements(container: HTMLElement): void {
	container.removeAttribute(DONE_ATTR);
	for (const el of Array.from(
		container.querySelectorAll<HTMLElement>(`.${COLLAPSIBLE_CLASS}`),
	)) {
		el.classList.remove(COLLAPSIBLE_CLASS, COLLAPSED_CLASS);
		el.removeAttribute("data-nui-path");
		for (const btn of Array.from(
			el.querySelectorAll(`.${COLLAPSE_BTN_CLASS}`),
		)) {
			btn.remove();
		}
		for (const summary of Array.from(
			el.querySelectorAll(`.${SUMMARY_CLASS}`),
		)) {
			summary.remove();
		}
	}
	const actions = container.querySelector(`.${HEADER_ACTIONS_CLASS}`);
	actions?.remove();
}

export { DONE_ATTR, CONTAINER_CLASS };
