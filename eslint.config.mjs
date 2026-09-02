import tobysmith568 from "@tobysmith568/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"] },
  ...tobysmith568.recommended
];
