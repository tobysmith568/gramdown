import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { convert, type ConvertOptions } from "../src/core";

const fixturePath = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

export const readFixture = async (name: string): Promise<Uint8Array> =>
  new Uint8Array(await readFile(fixturePath(name)));

/** Convert a fixture `.docx` by its base name (no extension). */
export const convertFixture = async (name: string, options?: ConvertOptions): Promise<string> =>
  convert(await readFixture(`${name}.docx`), options);

/** The committed expected output for a fixture, produced by `update-fixtures.ts`. */
export const expectedMarkdown = async (name: string): Promise<string> =>
  readFile(fixturePath(`${name}.md`), "utf8");
