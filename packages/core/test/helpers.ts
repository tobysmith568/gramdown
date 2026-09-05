import { type FixtureName, readFixture } from "@gramdown/fixtures";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { convert, type ConvertOptions } from "../src/core";

export { readFixture };

/** Convert a fixture `.docx` by its base name. */
export const convertFixture = async (
  name: FixtureName,
  options?: ConvertOptions
): Promise<string> => {
  const bytes = await readFixture(name);
  return convert(bytes, options);
};

/**
 * The committed expected output for a fixture, produced by `update-fixtures.ts`.
 * These snapshots stay in core — they are the spec of what `convert` produces,
 * not shared input data.
 */
export const expectedMarkdown = async (name: FixtureName): Promise<string> => {
  const url = new URL(`./fixtures/${name}.md`, import.meta.url);
  const path = fileURLToPath(url);
  return readFile(path, "utf8");
};
