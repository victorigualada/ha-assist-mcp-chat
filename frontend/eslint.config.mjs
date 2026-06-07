import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // Allow intentionally-unused names when prefixed with an underscore
      // (e.g. `catch (_err)`), which this codebase uses throughout.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Must come before our rule overrides so Prettier owns formatting; note it
  // disables `curly`, which we re-enable below.
  prettier,
  {
    files: ["src/**/*.ts"],
    rules: {
      // Require braces on all control-flow bodies, including one-liners.
      // Safe with "all" — only the multi-line/multi-or-nest options conflict
      // with Prettier, so this re-enable is intentional after eslint-config-prettier.
      curly: ["error", "all"],
    },
  }
);
