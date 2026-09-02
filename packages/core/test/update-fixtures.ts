// Regenerate the expected Markdown beside each fixture `.docx`.
//
//   bun run test:update
//
// Always read the resulting diff — these files are the specification of what
// the converter is supposed to produce.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { convert } from "../src/core.js";

const directory = fileURLToPath(new URL("./fixtures/", import.meta.url));

for (const entry of await readdir(directory)) {
  if (!entry.endsWith(".docx")) continue;

  const markdown = await convert(new Uint8Array(await readFile(directory + entry)));
  const output = `${entry.slice(0, -".docx".length)}.md`;
  await writeFile(directory + output, markdown);
  console.log(`Wrote ${output}`);
}
