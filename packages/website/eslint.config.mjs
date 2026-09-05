import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

// Standalone (not the repo-root config): the site needs the Astro + jsx-a11y rulesets, which
// @tobysmith568/eslint-config doesn't carry. Mirrors ../tobysmith.uk. The Playwright ruleset
// joins here in milestone 8.11 when the e2e suite lands.
export default [
  {
    ignores: ["dist/**", ".astro/**"]
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],
  ...eslintPluginAstro.configs["flat/jsx-a11y-recommended"]
];
