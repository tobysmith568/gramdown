import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { convert, type ConvertOptions } from "../src/core";

const fixturePath = (name: string): string => {
  const url = new URL(`./fixtures/${name}`, import.meta.url);
  return fileURLToPath(url);
};

export const readFixture = async (name: string): Promise<Uint8Array> => {
  const path = fixturePath(name);
  const contents = await readFile(path);
  return new Uint8Array(contents);
};

/** Convert a fixture `.docx` by its base name (no extension). */
export const convertFixture = async (name: string, options?: ConvertOptions): Promise<string> => {
  const bytes = await readFixture(`${name}.docx`);
  return convert(bytes, options);
};

/** The committed expected output for a fixture, produced by `update-fixtures.ts`. */
export const expectedMarkdown = async (name: string): Promise<string> => {
  const path = fixturePath(`${name}.md`);
  return readFile(path, "utf8");
};
