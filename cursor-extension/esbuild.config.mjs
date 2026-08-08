import esbuild from "esbuild";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.argv[2] === "production";
const outDir = path.join(__dirname, "dist");

const context = await esbuild.context({
	entryPoints: [path.join(__dirname, "src/extension.ts")],
	bundle: true,
	external: ["vscode"],
	format: "cjs",
	platform: "node",
	target: "node18",
	logLevel: "info",
	sourcemap: !prod,
	outfile: path.join(outDir, "extension.js"),
});

if (prod) {
	await context.rebuild();
	await context.dispose();
	process.exit(0);
} else {
	console.log(`[nui-cursor] watching — output: ${outDir}`);
	await context.watch();
}
