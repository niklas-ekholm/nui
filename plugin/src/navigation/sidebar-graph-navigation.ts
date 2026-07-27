
import { App, Plugin, WorkspaceLeaf } from "obsidian";

function isMainWorkspaceLeaf(app: App, leaf: WorkspaceLeaf): boolean {
	const root = leaf.getRoot();
	const { leftSplit, rightSplit } = app.workspace;
	return !!(root && root !== leftSplit && root !== rightSplit);
}

function isSidebarGraphLeaf(app: App, leaf: WorkspaceLeaf): boolean {
	return (
		!isMainWorkspaceLeaf(app, leaf) && leaf.getViewState().type === "graph"
	);
}

type LeafWithCanNavigate = WorkspaceLeaf & { canNavigate?: () => boolean };

/**
 * Sidebar graph leaves navigate in-place by default, replacing the graph with
 * the clicked note. Block that so node clicks open in the main workspace pane
 * instead (same idea as Pane Relief focus lock, scoped to graph views only).
 */
export class SidebarGraphNavigation {
	constructor(private plugin: Plugin) {}

	onload(): void {
		this.plugin.app.workspace.onLayoutReady(() => {
			this.installCanNavigatePatch();
		});
	}

	private installCanNavigatePatch(): void {
		const proto = WorkspaceLeaf.prototype as LeafWithCanNavigate;
		const original = proto.canNavigate;
		if (!original) return;

		const app = this.plugin.app;
		proto.canNavigate = function (this: WorkspaceLeaf) {
			if (isSidebarGraphLeaf(app, this)) {
				return false;
			}
			return original.call(this);
		};

		this.plugin.register(() => {
			proto.canNavigate = original;
		});
	}
}

