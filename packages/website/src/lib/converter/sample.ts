/**
 * The worked example shown in the index-page converter, before anyone drops a
 * file of their own. `src/assets/sample.docx` is a real Grammarly export; it is
 * run through `@gramdown/core` here at build time so the panel always shows
 * genuine converter output rather than a hand-copied approximation.
 *
 * Both variants are produced — with and without code-language guessing — so the
 * panel can switch between them live when the visitor toggles the checkbox, the
 * same as it does for a file they dropped.
 *
 * Like `release.ts`, the top-level `await` runs once during `astro build`. If the
 * `.docx` is missing or fails to convert it falls back to a short static string
 * so the build never breaks.
 */

import { convert } from "@gramdown/core";
import { languageGuesser } from "@gramdown/core/guess-lang";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface SampleConversion {
  sourceName: string;
  outputName: string;
  /** Converted with code-language guessing off (bare fences). */
  markdown: string;
  /** Converted with guessing on (fences labelled with a guessed language). */
  markdownGuessed: string;
}

const sourceName = "sample.docx";
const outputName = "sample.md";

const fallbackMarkdown = `# Keeping a changelog by hand

Automated changelogs read like a commit log, because that is what they are. A
short summary of each release, written by a person, is far kinder to the people
who actually read it: your users.
`;

const loadSample = async (): Promise<SampleConversion> => {
  try {
    // `astro build` / `astro dev` both run with the package root as the cwd; the
    // `.docx` is not bundled, so read it straight off disk rather than via a
    // module-relative URL (the build flattens those).
    const path = resolve(process.cwd(), "src/assets/sample.docx");
    const buffer = await readFile(path);
    const bytes = new Uint8Array(buffer);
    const markdown = await convert(bytes);
    const markdownGuessed = await convert(bytes, { guessLanguage: languageGuesser });
    return { sourceName, outputName, markdown, markdownGuessed };
  } catch (error) {
    console.warn(
      "[sample] could not convert src/assets/sample.docx; using the fallback text",
      error
    );
    return {
      sourceName,
      outputName,
      markdown: fallbackMarkdown,
      markdownGuessed: fallbackMarkdown
    };
  }
};

export const sampleConversion: SampleConversion = await loadSample();
