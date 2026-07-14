
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
}

export interface TimelineDocumentInput {
	path: string;
	content: string;
}

