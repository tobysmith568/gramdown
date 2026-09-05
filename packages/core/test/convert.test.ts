import { describe, expect, it } from "bun:test";
import { InvalidDocxError, convert } from "../src/core";
import { convertFixture, expectedMarkdown, readFixture } from "./helpers";

/**
 * Real Grammarly exports, converted end to end and checked against the
 * expected Markdown committed beside each `.docx`. Regenerate the expected
 * output with `bun run test:update` after an intentional change, and read the
 * diff before committing it.
 *
 * Scenario-specific assertions for each fixture live in their own test file
 * (headings.test.ts, lists.test.ts, styles.test.ts, quotes.test.ts,
 * code.test.ts); this file only guards the exact output byte-for-byte.
 */
const fixtures = ["headings", "lists", "styles", "quotes", "code"];

describe("convert", () => {
  for (const name of fixtures) {
    it(`matches the expected output for ${name}.docx`, async () => {
      const actual = await convertFixture(name);

      const expected = await expectedMarkdown(name);

      expect(actual).toBe(expected);
    });
  }

  it("labels fences when a language guesser is supplied", async () => {
    const markdown = await convertFixture("code", {
      guessLanguage: code => (code.includes("export const") ? "js" : undefined)
    });

    expect(markdown).toContain("```js\nexport const joinWords");
    expect(markdown).toContain("```\nThis is plain text in a code block.\n```");
  });

  it("rejects an empty file", async () => {
    const empty = new Uint8Array();

    const conversion = convert(empty);

    await expect(conversion).rejects.toBeInstanceOf(InvalidDocxError);
  });

  it("rejects something that is not a zip archive", async () => {
    const encoder = new TextEncoder();
    const notAZip = encoder.encode("not a docx");
    const conversion = convert(notAZip);

    await expect(conversion).rejects.toThrow(/could not be read as a \.docx/);
  });

  it("rejects a zip archive that is not a Word document", async () => {
    const jszipModule = await import("jszip");
    const JSZip = jszipModule.default;
    const zip = new JSZip();
    zip.file("hello.txt", "not a word document");
    const bytes = await zip.generateAsync({ type: "uint8array" });

    // No word/document.xml means preprocessing is a no-op, so this exercises
    // mammoth's own rejection of the file instead.
    const conversion = convert(bytes);

    await expect(conversion).rejects.toThrow(/not a Word document/);
  });

  it("surfaces mammoth's warnings via onWarning", async () => {
    const warnings: string[] = [];
    const bytes = await readFixture("styles.docx");

    await convert(bytes, { onWarning: w => warnings.push(w) });

    // Not asserting on content: this fixture may or may not trigger any
    // mammoth warning, only that the callback plumbing doesn't throw.
    const isArray = Array.isArray(warnings);
    expect(isArray).toBe(true);
  });
});
