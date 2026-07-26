
import { formatDisplayDate } from "../parse/dates";

export type ScoreChartMode = "line" | "bars";

export interface ScoreChartPoint {
	date: Date;
	dateKey: string;
	score: number;
	filePath: string;
}

export interface ScoreChartRenderOptions {
	points: ScoreChartPoint[];
	mode: ScoreChartMode;
	graphLine?: number;
	onPointClick?: (
		point: ScoreChartPoint,
		evt: MouseEvent,
		anchorEl: HTMLElement,
	) => void;
}

const VIEW_W = 1000;
const VIEW_H = 480;
const PAD_LEFT = 56;
const PAD_RIGHT = 28;
const PAD_TOP = 28;
const PAD_BOTTOM = 52;
const Y_TICKS = 4;

interface Scale {
	yMin: number;
	yMax: number;
	plotLeft: number;
	plotRight: number;
	plotTop: number;
	plotBottom: number;
	slotWidth: number;
	count: number;
}

function niceRound(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.round(value);
}

function buildScale(points: ScoreChartPoint[], graphLine?: number): Scale {
	const scores = points.map((point) => point.score);
	let lo = Math.min(...scores);
	let hi = Math.max(...scores);

	if (graphLine !== undefined && Number.isFinite(graphLine)) {
		lo = Math.min(lo, graphLine);
		hi = Math.max(hi, graphLine);
	}

	if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
		lo = 0;
		hi = 1;
	}
	if (lo === hi) {
		lo -= 1;
		hi += 1;
	}

	const pad = (hi - lo) * 0.1;
	const plotLeft = PAD_LEFT;
	const plotRight = VIEW_W - PAD_RIGHT;
	const count = points.length;

	return {
		yMin: lo - pad,
		yMax: hi + pad,
		plotLeft,
		plotRight,
		plotTop: PAD_TOP,
		plotBottom: VIEW_H - PAD_BOTTOM,
		slotWidth: count > 0 ? (plotRight - plotLeft) / count : plotRight - plotLeft,
		count,
	};
}

function slotCenter(scale: Scale, index: number): number {
	return scale.plotLeft + (index + 0.5) * scale.slotWidth;
}

function scoreToY(scale: Scale, score: number): number {
	const ratio = (score - scale.yMin) / (scale.yMax - scale.yMin);
	return scale.plotBottom - ratio * (scale.plotBottom - scale.plotTop);
}

export function renderScoreChart(
	container: HTMLElement,
	options: ScoreChartRenderOptions,
): void {
	const existing = container.querySelector(".nui-score-chart-root");
	if (existing) {
		existing.remove();
	} else {
		container.empty();
		container.classList.add("nui-score-chart");
	}

	const shell = container.createDiv("nui-score-chart-root");

	if (options.points.length === 0) {
		shell.createDiv({
			cls: "nui-score-chart-empty",
			text: "No scores. Add notes with a numeric score property.",
		});
		return;
	}

	const scale = buildScale(options.points, options.graphLine);
	const svg = shell.createSvg("svg", {
		cls: "nui-score-chart-svg",
		attr: {
			viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
			preserveAspectRatio: "xMidYMid meet",
			role: "img",
		},
	});

	renderGridlines(svg, scale);
	if (options.mode === "bars") {
		renderBars(svg, scale, options);
	} else {
		renderLine(svg, scale, options);
	}
	renderXLabels(svg, scale, options.points);
	if (options.graphLine !== undefined && Number.isFinite(options.graphLine)) {
		renderGraphLine(svg, scale, options.graphLine);
	}

	const tooltip = shell.createDiv("nui-score-chart-tooltip");
	tooltip.toggleClass("is-hidden", true);
	attachInteractions(svg, shell, tooltip, scale, options);
}

function renderGridlines(svg: SVGElement, scale: Scale): void {
	const group = svg.createSvg("g", { cls: "nui-score-chart-grid" });

	for (let i = 0; i <= Y_TICKS; i++) {
		const ratio = i / Y_TICKS;
		const value = scale.yMin + ratio * (scale.yMax - scale.yMin);
		const y = scoreToY(scale, value);

		group.createSvg("line", {
			cls: "nui-score-chart-gridline",
			attr: {
				x1: scale.plotLeft,
				y1: y,
				x2: scale.plotRight,
				y2: y,
			},
		});

		group.createSvg("text", {
			cls: "nui-score-chart-axis-label",
			attr: {
				x: scale.plotLeft - 10,
				y,
				"text-anchor": "end",
				"dominant-baseline": "middle",
			},
		}).textContent = String(niceRound(value));
	}
}

function renderLine(
	svg: SVGElement,
	scale: Scale,
	options: ScoreChartRenderOptions,
): void {
	const group = svg.createSvg("g", { cls: "nui-score-chart-series" });

	const coords = options.points.map(
		(point, index) => `${slotCenter(scale, index)},${scoreToY(scale, point.score)}`,
	);

	if (coords.length > 1) {
		group.createSvg("polyline", {
			cls: "nui-score-chart-line",
			attr: { points: coords.join(" ") },
		});
	}

	options.points.forEach((point, index) => {
		group.createSvg("circle", {
			cls: "nui-score-chart-point",
			attr: {
				cx: slotCenter(scale, index),
				cy: scoreToY(scale, point.score),
				r: 6,
				"data-index": index,
			},
		});
	});
}

function renderBars(
	svg: SVGElement,
	scale: Scale,
	options: ScoreChartRenderOptions,
): void {
	const group = svg.createSvg("g", { cls: "nui-score-chart-series" });
	const barWidth = scale.slotWidth * 0.58;

	options.points.forEach((point, index) => {
		const center = slotCenter(scale, index);
		const y = scoreToY(scale, point.score);
		const height = Math.max(0, scale.plotBottom - y);

		group.createSvg("rect", {
			cls: "nui-score-chart-bar",
			attr: {
				x: center - barWidth / 2,
				y,
				width: barWidth,
				height,
				rx: 3,
				"data-index": index,
			},
		});
	});
}

function renderXLabels(
	svg: SVGElement,
	scale: Scale,
	points: ScoreChartPoint[],
): void {
	const group = svg.createSvg("g", { cls: "nui-score-chart-x-axis" });
	const y = scale.plotBottom + 26;

	points.forEach((point, index) => {
		group.createSvg("text", {
			cls: "nui-score-chart-x-label",
			attr: {
				x: slotCenter(scale, index),
				y,
				"text-anchor": "middle",
			},
		}).textContent = formatDisplayDate(point.date);
	});
}

function renderGraphLine(svg: SVGElement, scale: Scale, value: number): void {
	const y = scoreToY(scale, value);
	const group = svg.createSvg("g", { cls: "nui-score-chart-custom-line" });

	group.createSvg("line", {
		cls: "nui-score-chart-custom-line-stroke",
		attr: {
			x1: scale.plotLeft,
			y1: y,
			x2: scale.plotRight,
			y2: y,
		},
	});

	group.createSvg("text", {
		cls: "nui-score-chart-custom-line-label",
		attr: {
			x: scale.plotRight - 6,
			y: y - 8,
			"text-anchor": "end",
		},
	}).textContent = String(niceRound(value));
}

function attachInteractions(
	svg: SVGElement,
	shell: HTMLElement,
	tooltip: HTMLElement,
	scale: Scale,
	options: ScoreChartRenderOptions,
): void {
	const markers = svg.querySelectorAll<SVGElement>("[data-index]");

	markers.forEach((marker) => {
		const index = Number(marker.getAttribute("data-index"));
		const point = options.points[index];
		if (!point) return;

		marker.addEventListener("mouseenter", () => {
			tooltip.empty();
			tooltip.createSpan({
				cls: "nui-score-chart-tooltip-score",
				text: String(point.score),
			});
			tooltip.createSpan({
				cls: "nui-score-chart-tooltip-date",
				text: formatDisplayDate(point.date),
			});
			tooltip.toggleClass("is-hidden", false);
		});

		marker.addEventListener("mousemove", (evt) => {
			const rect = shell.getBoundingClientRect();
			tooltip.style.left = `${evt.clientX - rect.left}px`;
			tooltip.style.top = `${evt.clientY - rect.top}px`;
		});

		marker.addEventListener("mouseleave", () => {
			tooltip.toggleClass("is-hidden", true);
		});

		marker.addEventListener("click", (evt) => {
			options.onPointClick?.(point, evt, marker as unknown as HTMLElement);
		});
	});
}
