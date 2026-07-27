import { MarkdownView, type Plugin, type TFile } from "obsidian";
import { setPropertyColor } from "./note-text-color";
import { openTextColorPicker } from "./text-color-picker-modal";
import { normalizeHexColor } from "./text-color-utils";

const SWATCH_CLASS = "nui-property-color-swatch";
const VALUE_CLASS = "nui-property-color-value";

function readPropertyValue(propertyEl: HTMLElement): string {
	// Obsidian text properties use contenteditable `.metadata-input-longtext`,
	// not <input>. Prefer that; do not use the whole value cell's textContent
	// (it also includes the hidden `.metadata-link` duplicate).
	const longtext = propertyEl.querySelector<HTMLElement>(
		".metadata-property-value .metadata-input-longtext",
	);
	if (longtext) {
		return longtext.textContent?.trim() ?? "";
	}

	const input = propertyEl.querySelector<HTMLInputElement>(
		".metadata-property-value input",
	);
	if (input) {
		return input.value.trim();
	}

	return "";
}

function getFileForPropertyEl(
	plugin: Plugin,
	propertyEl: HTMLElement,
): TFile | null {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (view instanceof MarkdownView && view.containerEl.contains(propertyEl)) {
			return view.file;
		}
	}

	return plugin.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null;
}

function openPickerForProperty(
	plugin: Plugin,
	propertyEl: HTMLElement,
	hex: string,
): void {
	const key = propertyEl.dataset.propertyKey?.trim();
	if (!key) {
		return;
	}

	const file = getFileForPropertyEl(plugin, propertyEl);
	if (!file) {
		return;
	}

	openTextColorPicker(plugin.app, {
		mode: "property",
		initialColor: hex,
		onApply: async (color) => {
			await setPropertyColor(plugin.app, file, key, color);
		},
		onClear: async () => {
			await setPropertyColor(plugin.app, file, key, null);
		},
	});
}

function ensureSwatch(
	plugin: Plugin,
	propertyEl: HTMLElement,
	valueEl: HTMLElement,
	hex: string,
): void {
	valueEl.classList.add(VALUE_CLASS);

	let swatch = valueEl.querySelector<HTMLButtonElement>(`.${SWATCH_CLASS}`);
	if (!swatch) {
		swatch = document.createElement("button");
		swatch.type = "button";
		swatch.className = SWATCH_CLASS;
		swatch.setAttribute("aria-label", "Color Picker");
		swatch.tabIndex = -1;
		swatch.addEventListener("click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();

			const current = normalizeHexColor(readPropertyValue(propertyEl));
			if (!current) {
				return;
			}

			openPickerForProperty(plugin, propertyEl, current);
		});
		swatch.addEventListener("mousedown", (evt) => {
			// Keep focus in the property field; avoid stealing edit state.
			evt.preventDefault();
		});
	}

	// Keep swatch immediately before the editable value.
	const longtext = valueEl.querySelector(".metadata-input-longtext");
	if (longtext) {
		if (swatch.nextElementSibling !== longtext) {
			valueEl.insertBefore(swatch, longtext);
		}
	} else if (swatch.parentElement !== valueEl || valueEl.firstElementChild !== swatch) {
		valueEl.insertBefore(swatch, valueEl.firstChild);
	}

	if (swatch.dataset.nuiColor !== hex) {
		swatch.dataset.nuiColor = hex;
		swatch.style.backgroundColor = hex;
	}
}

function removeSwatch(propertyEl: HTMLElement): void {
	const valueEl = propertyEl.querySelector<HTMLElement>(
		".metadata-property-value",
	);
	valueEl?.querySelector(`.${SWATCH_CLASS}`)?.remove();
	valueEl?.classList.remove(VALUE_CLASS);
}

function syncPropertySwatch(plugin: Plugin, propertyEl: HTMLElement): void {
	const key = propertyEl.dataset.propertyKey?.trim();
	const valueEl = propertyEl.querySelector<HTMLElement>(
		".metadata-property-value",
	);
	if (!key || !valueEl) {
		removeSwatch(propertyEl);
		return;
	}

	const hex = normalizeHexColor(readPropertyValue(propertyEl));
	if (!hex) {
		removeSwatch(propertyEl);
		return;
	}

	ensureSwatch(plugin, propertyEl, valueEl, hex);
}

function syncAllPropertyColorSwatches(plugin: Plugin): void {
	for (const propertyEl of Array.from(
		document.querySelectorAll<HTMLElement>(".metadata-property"),
	)) {
		syncPropertySwatch(plugin, propertyEl);
	}
}

export function registerPropertyColorSwatch(plugin: Plugin): void {
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
				syncAllPropertyColorSwatches(plugin);
			} finally {
				syncing = false;
			}
		}, 50);
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
		plugin.app.metadataCache.on("changed", scheduleSync),
	);

	// contenteditable properties fire `input` on the longtext div
	plugin.registerDomEvent(document, "input", (evt) => {
		const target = evt.target;
		if (!(target instanceof Element)) {
			return;
		}

		const propertyEl = target.closest<HTMLElement>(".metadata-property");
		if (!propertyEl) {
			return;
		}

		syncPropertySwatch(plugin, propertyEl);
	});

	const observer = new MutationObserver(() => {
		if (syncing) {
			return;
		}
		scheduleSync();
	});
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true,
	});
	plugin.register(() => observer.disconnect());

	scheduleSync();
}
