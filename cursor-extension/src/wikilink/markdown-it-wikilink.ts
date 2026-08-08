import type * as vscode from "vscode";
import type { NoteIndex } from "./note-index";
import { resolveWikilinkHref } from "./resolve-wikilink";

const WIKILINK_PATTERN =
	/^\[\[([^\]|#]+?)(?:#([^\]|]+?))?(?:\|([^\]]+?))?\]\]/;

export interface MarkdownIt {
	inline: {
		ruler: {
			before: (
				ruleName: string,
				ruleId: string,
				rule: InlineRule,
			) => void;
		};
	};
	renderer: {
		rules: Record<string, RenderRule | undefined>;
	};
	utils: {
		escapeHtml: (value: string) => string;
	};
}

interface InlineState {
	src: string;
	pos: number;
	push: (type: string, tag: string, nesting: number) => Token;
}

interface Token {
	content: string;
	meta?: WikilinkMeta;
}

interface WikilinkMeta {
	target: string;
	heading?: string;
	alias: string;
}

interface RenderEnv {
	currentDocument?: vscode.Uri;
}

type InlineRule = (state: InlineState, silent: boolean) => boolean;
type RenderRule = (
	tokens: Token[],
	idx: number,
	options: unknown,
	env: RenderEnv,
) => string;

export function createWikilinkPlugin(noteIndex: NoteIndex): (md: MarkdownIt) => void {
	return (md: MarkdownIt): void => {
		md.inline.ruler.before("link", "nui_wikilink", (state, silent) => {
			if (state.src.charCodeAt(state.pos - 1) === 0x21) {
				return false;
			}

			const match = WIKILINK_PATTERN.exec(state.src.slice(state.pos));
			if (!match) {
				return false;
			}

			if (!silent) {
				const token = state.push("nui_wikilink", "", 0);
				token.meta = {
					target: match[1],
					heading: match[2],
					alias: match[3] ?? match[1],
				};
			}

			state.pos += match[0].length;
			return true;
		});

		md.renderer.rules.nui_wikilink = (tokens, idx, _options, env) => {
			const token = tokens[idx];
			const meta = token.meta;
			if (!meta) {
				return md.utils.escapeHtml(token.content);
			}

			const sourceFsPath = env.currentDocument?.fsPath;
			const { href, dataHref, resolved } = resolveWikilinkHref(
				meta.target,
				meta.heading,
				noteIndex.getSnapshot(),
				sourceFsPath,
			);

			const escapedHref = md.utils.escapeHtml(href);
			const escapedDataHref = md.utils.escapeHtml(dataHref);
			const escapedText = md.utils.escapeHtml(meta.alias);
			const classAttr = resolved
				? ""
				: ' class="nui-unresolved-wikilink"';

			return (
				`<a href="${escapedHref}" data-href="${escapedDataHref}"${classAttr}>${escapedText}</a>`
			);
		};
	};
}
