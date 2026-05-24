import js from "@eslint/js";
import globals from "globals";
export default [
	js.configs.recommended,
	{
		files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
		ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
			},
		},
		rules: {
			"no-console": "off",
			"no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			eqeqeq: ["error", "always"],
			//curly: ["error", "all"],
			"no-var": "error",
			"prefer-const": "error",
		},
        ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/coverage/**"],
	},
];
