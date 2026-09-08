import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginPlaywright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

// Standalone (not the repo-root config): the site needs the Astro + jsx-a11y rulesets, which
// @tobysmith568/eslint-config doesn't carry.
export default [
  {
    ignores: ["dist/**", ".astro/**", "playwright-report/**", "test-results/**"]
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],
  ...eslintPluginAstro.configs["flat/jsx-a11y-recommended"],
  {
    ...eslintPluginPlaywright.configs["flat/recommended"],
    files: ["e2e/**/*.ts", "playwright.config.ts"]
  }
];
