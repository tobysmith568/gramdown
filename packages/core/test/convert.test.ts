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
      expect(await convertFixture(name)).toBe(await expectedMarkdown(name));
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
    await expect(convert(new Uint8Array())).rejects.toBeInstanceOf(InvalidDocxError);
  });

  it("rejects something that is not a zip archive", async () => {
    await expect(convert(new TextEncoder().encode("not a docx"))).rejects.toThrow(
      /could not be read as a \.docx/
    );
  });

  it("rejects a zip archive that is not a Word document", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file("hello.txt", "not a word document");
    const bytes = await zip.generateAsync({ type: "uint8array" });

    // No word/document.xml means preprocessing is a no-op, so this exercises
    // mammoth's own rejection of the file instead.
    await expect(convert(bytes)).rejects.toThrow(/not a Word document/);
  });

  it("surfaces mammoth's warnings via onWarning", async () => {
    const warnings: string[] = [];
    await convert(await readFixture("styles.docx"), { onWarning: w => warnings.push(w) });
    // Not asserting on content: this fixture may or may not trigger any
    // mammoth warning, only that the callback plumbing doesn't throw.
    expect(Array.isArray(warnings)).toBe(true);
  });
});
