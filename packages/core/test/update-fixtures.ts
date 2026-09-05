// Regenerate the expected Markdown beside each fixture `.docx`.
//
//   bun run test:update
//
// Always read the resulting diff — these files are the specification of what
// the converter is supposed to produce.

import { fixtureNames, readFixture } from "@gramdown/fixtures";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { convert } from "../src/core";

const expectedDir = fileURLToPath(new URL("./fixtures/", import.meta.url));

for (const name of fixtureNames) {
  const bytes = await readFixture(name);
  const markdown = await convert(bytes);
  await writeFile(`${expectedDir}${name}.md`, markdown);
  console.log(`Wrote ${name}.md`);
}
