/// <reference types="./eslint-plugins.d.ts" />

import path from "node:path";
import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import reactQueryPlugin from "@tanstack/eslint-plugin-query";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.join(__dirname, ".gitignore");

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  { ignores: ["**/*.config.*", "eslint-plugins.d.ts"] },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.ts", "**/*.tsx"],
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@tanstack/query": reactQueryPlugin,
      "jsx-a11y": jsxA11y,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        2,
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: true,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      ...hooksPlugin.configs.recommended.rules,
      ...reactQueryPlugin.configs["flat/recommended"][0].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        React: "writable",
      },
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { projectService: true } },
  },
);
