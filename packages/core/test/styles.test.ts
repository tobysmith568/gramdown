import { describe, expect, it } from "bun:test";
import { convertFixture } from "./helpers";

describe("styles.docx", () => {
  it("writes bold and italic with GFM emphasis markers", async () => {
    const markdown = await convertFixture("styles");

    expect(markdown).toContain("This has **bold** text.");
    expect(markdown).toContain("This has _italic_ text.");
  });

  it("keeps deliberate underline as inline HTML, since Markdown has no syntax for it", async () => {
    const markdown = await convertFixture("styles");
    expect(markdown).toContain("This has <u>underlined</u> text.");
  });

  it("writes strikethrough with double tildes", async () => {
    const markdown = await convertFixture("styles");
    expect(markdown).toContain("This has ~~struck-through~~ text.");
  });

  it("keeps subscript and superscript as inline HTML", async () => {
    const markdown = await convertFixture("styles");

    expect(markdown).toContain("This has <sub>subscript</sub> text.");
    expect(markdown).toContain("This has <sup>superscript</sup> text.");
  });

  it("writes a hyperlink without Word's automatic underline on its text", async () => {
    const markdown = await convertFixture("styles");

    expect(markdown).toMatch(/This has \[hyperlinked]\(https?:\/\/[^)]+\) text\./);
    expect(markdown).not.toContain("<u>hyperlinked</u>");
  });
});
