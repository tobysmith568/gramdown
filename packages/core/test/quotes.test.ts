import { describe, expect, it } from "bun:test";
import { convertFixture } from "./helpers.js";

describe("quotes.docx", () => {
  it("writes a multi-line block quote with > on every line", async () => {
    const markdown = await convertFixture("quotes");

    expect(markdown).toContain("\n> This is a blockquote.\n>\n> It has multiple lines.\n");
  });

  it("has no way to tell a pull quote from plain body text", async () => {
    // Known limitation: Grammarly's docx export gives a pull quote no
    // formatting of its own — it is indistinguishable from an ordinary
    // paragraph once exported, so it round-trips as plain text.
    const markdown = await convertFixture("quotes");

    expect(markdown).toContain("\nThis is a pull quote\n");
    expect(markdown).not.toContain("> This is a pull quote");
  });
});
