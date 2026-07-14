
import { Component, setIcon } from "obsidian";

export interface EmbeddedToolbarButton {
	id: string;
	icon: string;
	label: string;
	onClick: (anchorEl: HTMLElement) => void;
}

const TOOLBAR_CLASS = "nui-bases-toolbar";

export function findEmbeddedBasesRoot(rootEl: HTMLElement): HTMLElement | null {
	return rootEl.closest(".bases-embed");
}

export function syncEmbeddedBasesChrome(
	component: Component,
	rootEl: HTMLElement,
	buttons: EmbeddedToolbarButton[],
): void {
	const embed = findEmbeddedBasesRoot(rootEl);
	if (!embed) {
		clearEmbeddedBasesChrome(rootEl);
		return;
	}

	embed.classList.add("nui-bases-embed");

	if (buttons.length === 0) {
		embed.querySelector(`:scope > .${TOOLBAR_CLASS}`)?.remove();
		return;
	}

	const toolbarEl = ensureToolbar(embed);
	toolbarEl.empty();

	const inner = toolbarEl.createDiv({
		cls: "bases-toolbar nui-bases-toolbar-inner",
	});
	inner.createDiv({ cls: "nui-bases-toolbar-spacer" });
	const actionsEl = inner.createDiv({
		cls: "nui-bases-toolbar-actions",
	});

	for (const button of buttons) {
		const itemEl = actionsEl.createDiv({
			cls: "bases-toolbar-item nui-bases-toolbar-item",
		});
		const iconEl = itemEl.createDiv({
			cls: "clickable-icon",
			attr: {
				role: "button",
				tabindex: "0",
				"aria-label": button.label,
			},
		});
		setIcon(iconEl, button.icon);
		iconEl.dataset.nuiToolbarButton = button.id;

		component.registerDomEvent(iconEl, "click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			button.onClick(iconEl);
		});
	}
}

export function clearEmbeddedBasesChrome(rootEl: HTMLElement): void {
	const embed = findEmbeddedBasesRoot(rootEl);
	if (!embed) return;

	embed.querySelector(`:scope > .${TOOLBAR_CLASS}`)?.remove();
	embed.classList.remove("nui-bases-embed");
}

function ensureToolbar(embed: HTMLElement): HTMLElement {
	const existing = embed.querySelector(`:scope > .${TOOLBAR_CLASS}`);
	if (existing instanceof HTMLElement) {
		return existing;
	}

	const toolbarEl = embed.createDiv({
		cls: `${TOOLBAR_CLASS} bases-header`,
	});
	const coreHeader = embed.querySelector(":scope > .bases-header");
	if (coreHeader) {
		coreHeader.insertAdjacentElement("beforebegin", toolbarEl);
	} else {
		embed.prepend(toolbarEl);
	}
	return toolbarEl;
}

