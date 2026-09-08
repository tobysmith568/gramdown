import { describe, expect, it } from "bun:test";
import { dedupeName, toMarkdownName } from "./filenames";

describe("toMarkdownName", () => {
  it("swaps a .docx extension for .md", () => {
    expect(toMarkdownName("report.docx")).toBe("report.md");
  });

  it("keeps spaces and other punctuation in the stem", () => {
    expect(toMarkdownName("My Post (final).docx")).toBe("My Post (final).md");
  });

  it("is case-insensitive about the extension", () => {
    expect(toMarkdownName("Report.DOCX")).toBe("Report.md");
  });

  it("strips a leading path, keeping only the basename", () => {
    expect(toMarkdownName("path/to/My Post.docx")).toBe("My Post.md");
    expect(toMarkdownName("C:\\Users\\me\\draft.docx")).toBe("draft.md");
  });

  it("trims surrounding whitespace from the stem", () => {
    expect(toMarkdownName("  spaced  .docx")).toBe("spaced.md");
  });

  it("falls back to document.md when the stem is empty", () => {
    expect(toMarkdownName(".docx")).toBe("document.md");
    expect(toMarkdownName("   .docx")).toBe("document.md");
  });

  it("still appends .md when there is no .docx extension to strip", () => {
    expect(toMarkdownName("notes")).toBe("notes.md");
  });
});

describe("dedupeName", () => {
  it("returns the name unchanged when it is free", () => {
    expect(dedupeName("report.md", [])).toBe("report.md");
    expect(dedupeName("report.md", ["other.md"])).toBe("report.md");
  });

  it("appends -2 on the first collision", () => {
    expect(dedupeName("report.md", ["report.md"])).toBe("report-2.md");
  });

  it("skips past every taken variant", () => {
    const taken = ["report.md", "report-2.md", "report-3.md"];
    expect(dedupeName("report.md", taken)).toBe("report-4.md");
  });

  it("inserts the suffix before the extension, not at the end", () => {
    expect(dedupeName("archive.tar.gz", ["archive.tar.gz"])).toBe("archive.tar-2.gz");
  });

  it("handles a name with no extension", () => {
    expect(dedupeName("README", ["README"])).toBe("README-2");
  });
});
