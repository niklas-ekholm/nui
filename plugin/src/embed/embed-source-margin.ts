export type EditorMarginRects = {
	sizer: DOMRectReadOnly;
	content: DOMRectReadOnly;
};

/** Horizontal/vertical inset around `.cm-content` inside `.cm-sizer`, plus pane margin beside the sizer. */
export function isPointInEditorMargin(
	x: number,
	y: number,
	rects: EditorMarginRects,
): boolean {
	const { sizer, content } = rects;
	if (x < sizer.left || x > sizer.right) {
		return true;
	}
	return (
		x < content.left ||
		x > content.right ||
		y < content.top ||
		y > content.bottom
	);
}
