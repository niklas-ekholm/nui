
export interface TimelineItem {
	id: string;
	title: string;
	start: Date;
	end: Date;
	startField?: string;
	endField?: string;
	type?: string;
	project?: string;
	projectLabel?: string;
	/** Note frontmatter `color` (#rrggbb), applied to timeline title text. */
	color?: string;
	/** Note frontmatter `responsibility`, used by embed pipe filters. */
	responsibility?: string;
}

export interface TimelineDocumentInput {
	path: string;
	content: string;
}

