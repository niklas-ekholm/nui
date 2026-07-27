import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
	{
		ignores: ["main.js", "node_modules/**"],
	},
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			ecmaVersion: 2022,
			sourceType: "module",
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			...tseslint.configs.recommended.rules,

			// Obsidian's release scan rejects both. There are currently zero of
			// either in src/; keep it that way.
			"no-restricted-properties": [
				"error",
				{
					property: "innerHTML",
					message:
						"Use createEl()/setText()/node cloning — Obsidian's review rejects innerHTML.",
				},
				{
					property: "outerHTML",
					message: "Use DOM APIs instead of outerHTML.",
				},
			],
			"no-restricted-syntax": [
				"error",
				{
					selector:
						"CallExpression[callee.property.name='insertAdjacentHTML']",
					message: "Use DOM APIs instead of insertAdjacentHTML.",
				},
			],
			"@typescript-eslint/no-explicit-any": "error",

			// Underscore-prefixed args are the codebase's existing convention for
			// deliberately unused callback parameters.
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],

			"@typescript-eslint/no-empty-object-type": "off",
			"no-console": ["error", { allow: ["warn", "error"] }],
			eqeqeq: ["error", "smart"],
			"prefer-const": "error",
		},
	},
	{
		files: ["src/**/*.test.ts"],
		rules: {
			"no-console": "off",
		},
	},
];
