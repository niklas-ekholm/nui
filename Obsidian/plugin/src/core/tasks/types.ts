
export interface TaskItem {
	text: string;
	completed: boolean;
	filePath: string;
	line: number;
	blockId?: string;
}

export function taskSignature(tasks: TaskItem[]): string {
	return tasks
		.map(
			(task) =>
				`${task.filePath}:${task.line}:${task.completed ? "1" : "0"}:${task.text}`,
		)
		.join("\n");
}

