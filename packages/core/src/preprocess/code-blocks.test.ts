import { describe, expect, it } from "bun:test";
import { codeBlockMembership, startsNewCodeBlock, styleCodeBlocks } from "./code-blocks";
import { body, codeParagraph, paragraph, run } from "./test-helpers";

const isCode = (xml: string) => /<w:pStyle w:val="SourceCode(Start)?"\/>/.test(xml);
const startsCode = (xml: string) => xml.includes('<w:pStyle w:val="SourceCodeStart"/>');

describe("styleCodeBlocks", () => {
  it("styles an all-monospace paragraph as a code block", () => {
    const result = styleCodeBlocks(body(paragraph(run("const x = 1;", true))));
    expect(isCode(result)).toBe(true);
  });

  it("leaves a prose paragraph unstyled", () => {
    const result = styleCodeBlocks(body(paragraph(run("Just some prose."))));
    expect(isCode(result)).toBe(false);
  });

  it("does not mistake a paragraph that mentions a font for one that uses it", () => {
    const result = styleCodeBlocks(body(paragraph(run("Grammarly uses Courier New."))));
    expect(isCode(result)).toBe(false);
  });

  it("keeps a blank line between two code lines inside the block", () => {
    const result = styleCodeBlocks(
      body(paragraph(run("first();", true)), paragraph(), paragraph(run("second();", true)))
    );

    // first() opens the block; the blank line and second() both continue it.
    expect(result.match(/<w:pStyle w:val="SourceCode(Start)?"\/>/g) ?? []).toHaveLength(3);
    expect(startsCode(result)).toBe(true);
    expect(result.match(/<w:pStyle w:val="SourceCode"\/>/g) ?? []).toHaveLength(2);
  });

  it("leaves a blank line between prose and code alone", () => {
    const result = styleCodeBlocks(
      body(paragraph(run("Prose.")), paragraph(), paragraph(run("code();", true)))
    );

    // The blank line here belongs to neither paragraph, so code(); has nothing
    // to continue and opens its own (single-line) block.
    expect(isCode(result)).toBe(true);
    expect(startsCode(result)).toBe(true);
  });

  it("styles a self-closing empty paragraph between code lines", () => {
    const result = styleCodeBlocks(
      body(paragraph(run("a();", true)), "<w:p />", paragraph(run("b();", true)))
    );

    expect(result).toContain('<w:p><w:pPr><w:pStyle w:val="SourceCode"/></w:pPr></w:p>');
  });

  it("preserves everything it does not touch", () => {
    const xml = body(paragraph(run("Untouched.")));
    expect(styleCodeBlocks(xml)).toBe(xml);
  });

  it("is idempotent", () => {
    const xml = body(paragraph(run("code();", true)));
    const once = styleCodeBlocks(xml);
    expect(styleCodeBlocks(once)).toBe(once);
  });

  it("keeps two single-line blocks written back to back as two separate blocks", () => {
    // No blank line, no prose, nothing at all between them — Grammarly's own
    // paragraph spacing (both sides at 200, the "standalone block" value) is
    // the only thing that tells them apart from one two-line block.
    const result = styleCodeBlocks(
      body(codeParagraph("one();", 200, 200), codeParagraph("two();", 200, 200))
    );

    expect(result.match(/<w:pStyle w:val="SourceCodeStart"\/>/g) ?? []).toHaveLength(2);
  });
});

describe("codeBlockMembership", () => {
  it("claims blank lines surrounded by code", () => {
    expect(codeBlockMembership(["code", "empty", "code"])).toEqual([true, true, true]);
  });

  it("claims a run of blank lines surrounded by code", () => {
    expect(codeBlockMembership(["code", "empty", "empty", "code"])).toEqual([
      true,
      true,
      true,
      true
    ]);
  });

  it("does not claim blank lines at the edges of a block", () => {
    expect(codeBlockMembership(["empty", "code", "empty"])).toEqual([false, true, false]);
  });

  it("does not claim a blank line between two prose paragraphs", () => {
    expect(codeBlockMembership(["other", "empty", "other"])).toEqual([false, false, false]);
  });
});

describe("startsNewCodeBlock", () => {
  const kinds = (...values: ("code" | "empty" | "other")[]) => values;

  it("starts a new block for the first code paragraph in the document", () => {
    const paragraphs = [codeParagraph("a();", 200, 200)];
    expect(startsNewCodeBlock(paragraphs, kinds("code"), [true])).toEqual([true]);
  });

  it("starts a new block right after prose", () => {
    const paragraphs = [paragraph(run("Prose.")), codeParagraph("a();", 200, 200)];
    expect(startsNewCodeBlock(paragraphs, kinds("other", "code"), [false, true])).toEqual([
      false,
      true
    ]);
  });

  it("continues the block across a blank line that belongs to it", () => {
    const paragraphs = [
      codeParagraph("a();", 200, 100),
      paragraph(),
      codeParagraph("b();", 100, 200)
    ];
    const inCodeBlock = [true, true, true];

    expect(startsNewCodeBlock(paragraphs, kinds("code", "empty", "code"), inCodeBlock)).toEqual([
      true,
      false,
      false
    ]);
  });

  it("starts a new block for an unrelated line directly after a blank that isn't in one", () => {
    const paragraphs = [paragraph(run("Prose.")), paragraph(), codeParagraph("a();", 200, 200)];
    const inCodeBlock = [false, false, true];

    expect(startsNewCodeBlock(paragraphs, kinds("other", "empty", "code"), inCodeBlock)).toEqual([
      false,
      false,
      true
    ]);
  });

  it("continues into the next line when spacing on both sides says so", () => {
    const paragraphs = [codeParagraph("a();", 200, 100), codeParagraph("b();", 100, 200)];
    const inCodeBlock = [true, true];

    expect(startsNewCodeBlock(paragraphs, kinds("code", "code"), inCodeBlock)).toEqual([
      true,
      false
    ]);
  });

  it("starts a new block when the previous line's spacing says it ended", () => {
    const paragraphs = [codeParagraph("a();", 200, 200), codeParagraph("b();", 200, 200)];
    const inCodeBlock = [true, true];

    expect(startsNewCodeBlock(paragraphs, kinds("code", "code"), inCodeBlock)).toEqual([
      true,
      true
    ]);
  });

  it("starts a new block when only one side's spacing says so", () => {
    // Asymmetric, and shouldn't come up from a real Grammarly export, but
    // either side alone claiming a boundary is enough not to merge blindly.
    const paragraphs = [codeParagraph("a();", 200, 100), codeParagraph("b();", 200, 200)];
    const inCodeBlock = [true, true];

    expect(startsNewCodeBlock(paragraphs, kinds("code", "code"), inCodeBlock)).toEqual([
      true,
      true
    ]);
  });
});
