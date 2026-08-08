import type NuiPlugin from "../main";

/**
 * The MiniNUI stand-in for register-bases-views.ts.
 *
 * The mini build resolves every import of `./views/register-bases-views` here,
 * so none of the view code is bundled. Kept as a module of its own rather than
 * an `if (IS_MINI)` guard because a class referenced from a live branch is a
 * class esbuild has to keep.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function registerBasesViews(_plugin: NuiPlugin): void {}
