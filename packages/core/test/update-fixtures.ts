// Regenerate the expected Markdown beside each fixture `.docx`.
//
//   bun run test:update
//
// Always read the resulting diff — these files are the specification of what
// the converter is supposed to produce.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { convert } from "../src/core";

const fixturesUrl = new URL("./fixtures/", import.meta.url);
const directory = fileURLToPath(fixturesUrl);

const entries = await readdir(directory);

for (const entry of entries) {
  if (!entry.endsWith(".docx")) {
    continue;
  }

  const docx = await readFile(directory + entry);
  const bytes = new Uint8Array(docx);
  const markdown = await convert(bytes);
  const output = `${entry.slice(0, -".docx".length)}.md`;
  await writeFile(directory + output, markdown);
  console.log(`Wrote ${output}`);
}
