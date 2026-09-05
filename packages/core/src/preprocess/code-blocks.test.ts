import { describe, expect, it } from "bun:test";
import { codeBlockMembership, startsNewCodeBlock, styleCodeBlocks } from "./code-blocks";
import { body, codeParagraph, line, paragraph } from "./test-helpers";

const isCode = (xml: string) => /<w:pStyle w:val="SourceCode(Start)?"\/>/.test(xml);
const startsCode = (xml: string) => xml.includes('<w:pStyle w:val="SourceCodeStart"/>');

describe("styleCodeBlocks", () => {
  it("styles an all-monospace paragraph as a code block", () => {
    const codePara = line("const x = 1;", true);
    const xml = body(codePara);

    const result = styleCodeBlocks(xml);
    const styled = isCode(result);

    expect(styled).toBe(true);
  });

  it("leaves a prose paragraph unstyled", () => {
    const prosePara = line("Just some prose.");
    const xml = body(prosePara);

    const result = styleCodeBlocks(xml);
    const styled = isCode(result);

    expect(styled).toBe(false);
  });

  it("does not mistake a paragraph that mentions a font for one that uses it", () => {
    const prosePara = line("Grammarly uses Courier New.");
    const xml = body(prosePara);

    const result = styleCodeBlocks(xml);
    const styled = isCode(result);

    expect(styled).toBe(false);
  });

  it("keeps a blank line between two code lines inside the block", () => {
    const first = line("first();", true);
    const blank = paragraph();
    const second = line("second();", true);
    const xml = body(first, blank, second);

    const result = styleCodeBlocks(xml);
    const allMarkers = result.match(/<w:pStyle w:val="SourceCode(Start)?"\/>/g) ?? [];
    const continuationMarkers = result.match(/<w:pStyle w:val="SourceCode"\/>/g) ?? [];
    const opensBlock = startsCode(result);

    // first() opens the block; the blank line and second() both continue it.
    expect(allMarkers).toHaveLength(3);
    expect(opensBlock).toBe(true);
    expect(continuationMarkers).toHaveLength(2);
  });

  it("leaves a blank line between prose and code alone", () => {
    const prose = line("Prose.");
    const blank = paragraph();
    const code = line("code();", true);
    const xml = body(prose, blank, code);

    const result = styleCodeBlocks(xml);
    const styled = isCode(result);
    const opensBlock = startsCode(result);

    // The blank line here belongs to neither paragraph, so code(); has nothing
    // to continue and opens its own (single-line) block.
    expect(styled).toBe(true);
    expect(opensBlock).toBe(true);
  });

  it("styles a self-closing empty paragraph between code lines", () => {
    const first = line("a();", true);
    const second = line("b();", true);
    const xml = body(first, "<w:p />", second);

    const result = styleCodeBlocks(xml);

    expect(result).toContain('<w:p><w:pPr><w:pStyle w:val="SourceCode"/></w:pPr></w:p>');
  });

  it("preserves everything it does not touch", () => {
    const prosePara = line("Untouched.");
    const xml = body(prosePara);

    const result = styleCodeBlocks(xml);

    expect(result).toBe(xml);
  });

  it("is idempotent", () => {
    const codePara = line("code();", true);
    const xml = body(codePara);

    const once = styleCodeBlocks(xml);
    const twice = styleCodeBlocks(once);

    expect(twice).toBe(once);
  });

  it("keeps two single-line blocks written back to back as two separate blocks", () => {
    // No blank line, no prose, nothing at all between them — Grammarly's own
    // paragraph spacing (both sides at 200, the "standalone block" value) is
    // the only thing that tells them apart from one two-line block.
    const first = codeParagraph("one();", 200, 200);
    const second = codeParagraph("two();", 200, 200);
    const xml = body(first, second);

    const result = styleCodeBlocks(xml);
    const startMarkers = result.match(/<w:pStyle w:val="SourceCodeStart"\/>/g) ?? [];

    expect(startMarkers).toHaveLength(2);
  });
});

describe("codeBlockMembership", () => {
  it("claims blank lines surrounded by code", () => {
    const membership = codeBlockMembership(["code", "empty", "code"]);

    expect(membership).toEqual([true, true, true]);
  });

  it("claims a run of blank lines surrounded by code", () => {
    const membership = codeBlockMembership(["code", "empty", "empty", "code"]);

    expect(membership).toEqual([true, true, true, true]);
  });

  it("does not claim blank lines at the edges of a block", () => {
    const membership = codeBlockMembership(["empty", "code", "empty"]);

    expect(membership).toEqual([false, true, false]);
  });

  it("does not claim a blank line between two prose paragraphs", () => {
    const membership = codeBlockMembership(["other", "empty", "other"]);

    expect(membership).toEqual([false, false, false]);
  });
});

describe("startsNewCodeBlock", () => {
  const kinds = (...values: ("code" | "empty" | "other")[]) => values;

  it("starts a new block for the first code paragraph in the document", () => {
    const paragraphs = [codeParagraph("a();", 200, 200)];
    const kindList = kinds("code");

    const result = startsNewCodeBlock(paragraphs, kindList, [true]);

    expect(result).toEqual([true]);
  });

  it("starts a new block right after prose", () => {
    const paragraphs = [line("Prose."), codeParagraph("a();", 200, 200)];
    const kindList = kinds("other", "code");

    const result = startsNewCodeBlock(paragraphs, kindList, [false, true]);

    expect(result).toEqual([false, true]);
  });

  it("continues the block across a blank line that belongs to it", () => {
    const paragraphs = [
      codeParagraph("a();", 200, 100),
      paragraph(),
      codeParagraph("b();", 100, 200)
    ];
    const kindList = kinds("code", "empty", "code");
    const inCodeBlock = [true, true, true];

    const result = startsNewCodeBlock(paragraphs, kindList, inCodeBlock);

    expect(result).toEqual([true, false, false]);
  });

  it("starts a new block for an unrelated line directly after a blank that isn't in one", () => {
    const paragraphs = [line("Prose."), paragraph(), codeParagraph("a();", 200, 200)];
    const kindList = kinds("other", "empty", "code");
    const inCodeBlock = [false, false, true];

    const result = startsNewCodeBlock(paragraphs, kindList, inCodeBlock);

    expect(result).toEqual([false, false, true]);
  });

  it("continues into the next line when spacing on both sides says so", () => {
    const paragraphs = [codeParagraph("a();", 200, 100), codeParagraph("b();", 100, 200)];
    const kindList = kinds("code", "code");
    const inCodeBlock = [true, true];

    const result = startsNewCodeBlock(paragraphs, kindList, inCodeBlock);

    expect(result).toEqual([true, false]);
  });

  it("starts a new block when the previous line's spacing says it ended", () => {
    const paragraphs = [codeParagraph("a();", 200, 200), codeParagraph("b();", 200, 200)];
    const kindList = kinds("code", "code");
    const inCodeBlock = [true, true];

    const result = startsNewCodeBlock(paragraphs, kindList, inCodeBlock);

    expect(result).toEqual([true, true]);
  });

  it("starts a new block when only one side's spacing says so", () => {
    // Asymmetric, and shouldn't come up from a real Grammarly export, but
    // either side alone claiming a boundary is enough not to merge blindly.
    const paragraphs = [codeParagraph("a();", 200, 100), codeParagraph("b();", 200, 200)];
    const kindList = kinds("code", "code");
    const inCodeBlock = [true, true];

    const result = startsNewCodeBlock(paragraphs, kindList, inCodeBlock);

    expect(result).toEqual([true, true]);
  });
});
