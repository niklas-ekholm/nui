
import { BasesView, QueryController, TFile } from "obsidian";
import { entriesToScorePoints, ScorePoint } from "../bases/score-from-entries";
import {
	renderScoreChart,
	ScoreChartMode,
} from "../core/score-chart/render-score-chart";
import {
	clearMountedBasesTitle,
	createNuiBasesContainer,
} from "../bases/bases-view-title";
import {
	findHostFileForElement,
	openFileInWorkspace,
} from "../navigation/folder-index";
import { SCORE_CHART_BASES_VIEW_TYPE } from "../layouts/types";

export class ScoreChartBasesView extends BasesView {
	readonly type = SCORE_CHART_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private renderedSignature = "";

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-score-chart-bases-container",
		);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				const host = findHostFileForElement(this.app, this.containerEl);
				if (host && file.path === host.path) {
					this.renderedSignature = "";
					this.onDataUpdated();
				}
			}),
		);
	}

	onDataUpdated(): void {
		const mode = this.resolveMode();
		const graphLine = this.resolveGraphLine();
		const points = entriesToScorePoints(this.data.data, this.config);
		const signature = this.signature(points, mode, graphLine);

		if (
			signature === this.renderedSignature &&
			this.containerEl.querySelector(".nui-score-chart-root")
		) {
			return;
		}

		clearMountedBasesTitle(this.containerEl);
		this.renderedSignature = signature;

		renderScoreChart(this.containerEl, {
			points,
			mode,
			graphLine,
			onPointClick: (point, evt, anchorEl) => {
				const file = this.app.vault.getAbstractFileByPath(point.filePath);
				if (file instanceof TFile) {
					void openFileInWorkspace(this.app, file, { anchorEl, evt });
				}
			},
		});
	}

	private resolveMode(): ScoreChartMode {
		const name = this.config.name?.trim().toLowerCase();
		return name === "bars" ? "bars" : "line";
	}

	private resolveGraphLine(): number | undefined {
		const host = findHostFileForElement(this.app, this.containerEl);
		if (!host) return undefined;

		const raw = this.app.metadataCache.getFileCache(host)?.frontmatter?.graphLine;
		if (raw === undefined || raw === null || raw === "") return undefined;

		const value = Number(raw);
		return Number.isFinite(value) ? value : undefined;
	}

	private signature(
		points: ScorePoint[],
		mode: ScoreChartMode,
		graphLine: number | undefined,
	): string {
		const rows = points
			.map((point) => `${point.dateKey}:${point.score}`)
			.join("\n");
		return `${mode}\n${graphLine ?? ""}\n${rows}`;
	}
}
