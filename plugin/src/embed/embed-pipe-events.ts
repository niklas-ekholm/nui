export const EMBED_PIPES_CHANGED_EVENT = "nui-embed-pipes-changed";

export function notifyEmbedPipeViews(root: ParentNode): void {
	for (const el of Array.from(
		root.querySelectorAll<HTMLElement>(
			".nui-timeline-bases-container, .nui-task-list-bases-root, .nui-cards-bases-root",
		),
	)) {
		el.dispatchEvent(new CustomEvent(EMBED_PIPES_CHANGED_EVENT));
	}
}
