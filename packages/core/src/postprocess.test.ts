import { describe, expect, it } from "bun:test";
import { normaliseBlankLines, postprocess } from "./postprocess";

describe("normaliseBlankLines", () => {
  it("collapses runs of blank lines to one", () => {
    const result = normaliseBlankLines("a\n\n\n\nb");

    expect(result).toBe("a\n\nb\n");
  });

  it("strips trailing whitespace from each line", () => {
    const result = normaliseBlankLines("a   \nb\t");

    expect(result).toBe("a\nb\n");
  });

  it("ends the document with exactly one newline", () => {
    const fromTrailingBlanks = normaliseBlankLines("a\n\n\n");
    const fromNoNewline = normaliseBlankLines("a");

    expect(fromTrailingBlanks).toBe("a\n");
    expect(fromNoNewline).toBe("a\n");
  });

  it("trims leading blank lines", () => {
    const result = normaliseBlankLines("\n\n# Title");

    expect(result).toBe("# Title\n");
  });
});

describe("postprocess", () => {
  it("tidies the whitespace around and between blocks, without merging them", () => {
    // Two `<pre>`s that stayed separate coming out of html-to-markdown are two
    // deliberate blocks (see startsNewCodeBlock in preprocess.ts) — postprocess
    // only normalises whitespace, it never merges fences back together.
    const result = postprocess("\n\n```\na\n```\n\n\n```\nb\n```\n\n\n");

    expect(result).toBe("```\na\n```\n\n```\nb\n```\n");
  });
});

describe("normaliseBlankLines inside code", () => {
  it("keeps consecutive blank lines inside a fenced block", () => {
    const markdown = "```\na();\n\n\nb();\n```\n";

    const result = normaliseBlankLines(markdown);

    expect(result).toBe(markdown);
  });

  it("keeps trailing whitespace inside a fenced block", () => {
    const markdown = "```\na();  \n```\n";

    const result = normaliseBlankLines(markdown);

    expect(result).toBe(markdown);
  });

  it("does not treat a backtick line inside a longer fence as the end", () => {
    const markdown = "````\n```\n\n\n```\n````\n\nProse.\n";

    const result = normaliseBlankLines(markdown);

    expect(result).toBe(markdown);
  });

  it("still tidies the prose around a block", () => {
    const result = normaliseBlankLines("A.\n\n\n```\nx\n```\n\n\nB.\n");

    expect(result).toBe("A.\n\n```\nx\n```\n\nB.\n");
  });
});
