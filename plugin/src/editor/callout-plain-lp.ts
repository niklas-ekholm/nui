import type { Range } from "@codemirror/state";
import { Decoration, type WidgetType } from "@codemirror/view";

/** Obsidian CalloutWidget — block LP replace widget for `> [!type]` lines. */
export function isCalloutBlockWidget(widget: WidgetType): boolean {
	const proto = (widget.constructor as { prototype: object }).prototype;
	return (
		typeof (proto as { getType?: unknown }).getType === "function" &&
		typeof (proto as { getTypePos?: unknown }).getTypePos === "function" &&
		typeof (proto as { updateType?: unknown }).updateType === "function"
	);
}

function widgetFromRange(range: Range<Decoration>): WidgetType | null {
	const deco = range.value as Decoration & {
		spec?: { widget?: WidgetType };
		widget?: WidgetType;
	};
	return deco.spec?.widget ?? deco.widget ?? null;
}

function isCalloutDecorationRange(range: Range<Decoration>): boolean {
	const widget = widgetFromRange(range);
	return widget != null && isCalloutBlockWidget(widget);
}

/** Drop callout replace widgets so LP always edits the raw source lines. */
export function filterCalloutLivePreviewDecorations(
	of: Range<Decoration> | readonly Range<Decoration>[],
): Range<Decoration> | readonly Range<Decoration>[] | null {
	if (Array.isArray(of)) {
		return of.filter((range) => !isCalloutDecorationRange(range));
	}

	const single = of as Range<Decoration>;
	if (isCalloutDecorationRange(single)) {
		return null;
	}

	return single;
}
