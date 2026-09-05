import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/guess-lang.ts"],
  format: "esm",
  dts: true,
  clean: true,
  // package.json already says "type": "module" — no need for the unambiguous
  // .mjs/.cjs extensions tsdown defaults to on the node platform.
  fixedExtension: false
});
