import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Base names of the committed fixture `.docx` files. */
export type FixtureName = "headings" | "lists" | "styles" | "quotes" | "code";

export const fixtureNames: FixtureName[] = ["headings", "lists", "styles", "quotes", "code"];

/** Absolute path to a fixture `.docx` on disk. */
export const fixturePath = (name: FixtureName): string => {
  const url = new URL(`./${name}.docx`, import.meta.url);
  return fileURLToPath(url);
};

/** The bytes of a fixture `.docx`, ready to hand to `convert()`. */
export const readFixture = async (name: FixtureName): Promise<Uint8Array> => {
  const path = fixturePath(name);
  const contents = await readFile(path);
  return new Uint8Array(contents);
};
