import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/bin.ts"],
  format: "esm",
  clean: true,
  // package.json says "type": "module" — no need for tsdown's default .mjs.
  fixedExtension: false,
  // This package is a bin, not an importable library (no "main"/"exports"/
  // "types" in package.json) — it has nothing worth declaring types for.
  dts: false
});
