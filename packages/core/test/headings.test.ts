import { describe, expect, it } from "bun:test";
import { convertFixture } from "./helpers.js";

describe("headings.docx", () => {
  it("maps Word's three heading levels to ATX headings of the same depth", async () => {
    const markdown = await convertFixture("headings");

    expect(markdown).toContain("\n# This is a large heading.\n");
    expect(markdown).toContain("\n## This is a medium heading.\n");
    expect(markdown).toContain("\n### This is a small heading.\n");
  });

  it("leaves normal paragraphs as plain text either side of the headings", async () => {
    const markdown = await convertFixture("headings");

    expect(markdown.startsWith("Start of document.\n")).toBe(true);
    expect(markdown.trimEnd().endsWith("End of document.")).toBe(true);
    expect(markdown).toContain("\nThis is normal text.\n");
  });
});
