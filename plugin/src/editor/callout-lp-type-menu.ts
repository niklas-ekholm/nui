import { Menu } from "obsidian";
import {
	CALLOUT_TYPE_PICKER_OPTIONS,
	getObsidianCalloutIconId,
} from "./callout-lp-icon-ids";
import { canonicalCalloutType } from "./callout-lp-parse";

export type CalloutTypeMenuOptions = {
	currentType: string;
	onPick: (type: string) => void;
};

export function showCalloutTypeMenu(
	event: MouseEvent,
	options: CalloutTypeMenuOptions,
): void {
	event.preventDefault();
	event.stopPropagation();

	const current = canonicalCalloutType(options.currentType);
	const menu = new Menu();

	for (const { type, label } of CALLOUT_TYPE_PICKER_OPTIONS) {
		menu.addItem((item) => {
			item
				.setTitle(label)
				.setIcon(getObsidianCalloutIconId(type))
				.setChecked(type === current)
				.onClick(() => {
					options.onPick(type);
				});
		});
	}

	menu.showAtMouseEvent(event);
}
