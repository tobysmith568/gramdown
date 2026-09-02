import { describe, expect, it } from "bun:test";
import { normaliseBlankLines, postprocess } from "./postprocess";

describe("normaliseBlankLines", () => {
  it("collapses runs of blank lines to one", () => {
    expect(normaliseBlankLines("a\n\n\n\nb")).toBe("a\n\nb\n");
  });

  it("strips trailing whitespace from each line", () => {
    expect(normaliseBlankLines("a   \nb\t")).toBe("a\nb\n");
  });

  it("ends the document with exactly one newline", () => {
    expect(normaliseBlankLines("a\n\n\n")).toBe("a\n");
    expect(normaliseBlankLines("a")).toBe("a\n");
  });

  it("trims leading blank lines", () => {
    expect(normaliseBlankLines("\n\n# Title")).toBe("# Title\n");
  });
});

describe("postprocess", () => {
  it("tidies the whitespace around and between blocks, without merging them", () => {
    // Two `<pre>`s that stayed separate coming out of html-to-markdown are two
    // deliberate blocks (see startsNewCodeBlock in preprocess.ts) — postprocess
    // only normalises whitespace, it never merges fences back together.
    expect(postprocess("\n\n```\na\n```\n\n\n```\nb\n```\n\n\n")).toBe(
      "```\na\n```\n\n```\nb\n```\n"
    );
  });
});

describe("normaliseBlankLines inside code", () => {
  it("keeps consecutive blank lines inside a fenced block", () => {
    const markdown = "```\na();\n\n\nb();\n```\n";
    expect(normaliseBlankLines(markdown)).toBe(markdown);
  });

  it("keeps trailing whitespace inside a fenced block", () => {
    const markdown = "```\na();  \n```\n";
    expect(normaliseBlankLines(markdown)).toBe(markdown);
  });

  it("does not treat a backtick line inside a longer fence as the end", () => {
    const markdown = "````\n```\n\n\n```\n````\n\nProse.\n";
    expect(normaliseBlankLines(markdown)).toBe(markdown);
  });

  it("still tidies the prose around a block", () => {
    expect(normaliseBlankLines("A.\n\n\n```\nx\n```\n\n\nB.\n")).toBe("A.\n\n```\nx\n```\n\nB.\n");
  });
});
