/**
 * Compile-time build flags, replaced by esbuild's `define`.
 *
 * MiniNUI is the same plugin built without the Bases views: the appearance
 * layer, the editor tools, the navigation model, and every command stay, the
 * fourteen views go. It is generated from this source at release time — there
 * is no second codebase to keep in step. Guard mini-sensitive code with
 * `IS_MINI` so esbuild can drop the other branch.
 */
declare const __NUI_MINI__: boolean;

export const IS_MINI: boolean = __NUI_MINI__;
