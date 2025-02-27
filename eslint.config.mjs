import path from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ["**/.*.js", "**/*.config.js", "**/node_modules/", "**/dist/"],
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "prefer-const": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": ["on"],
      "@typescript-eslint/no-unused-vars": ["on"],
      "@typescript-eslint/no-explicit-any": ["on"],
    },
  },
  {
    files: ["**/__tests__/**/*"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]
