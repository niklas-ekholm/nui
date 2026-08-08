import type { Plugin } from "obsidian";
import { Prec } from "@codemirror/state";
import { calloutLpIconExtension } from "./callout-lp-icon-deco";

export function registerCalloutLpIconDeco(plugin: Plugin): void {
	plugin.registerEditorExtension(Prec.highest(calloutLpIconExtension));
}
