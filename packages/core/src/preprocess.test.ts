import { describe, expect, it } from "bun:test";
import JSZip from "jszip";
import {
  checklistLevel,
  codeBlockMembership,
  ensureStyles,
  isBlockQuote,
  isChecked,
  isChecklistItem,
  preprocessDocumentXml,
  preprocessDocx,
  startsNewCodeBlock
} from "./preprocess.js";

const MONO = '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" />';

const run = (text: string, monospace = false) =>
  `<w:r><w:rPr>${monospace ? MONO : ""}</w:rPr><w:t>${text}</w:t></w:r>`;

const paragraph = (...children: string[]) =>
  `<w:p><w:pPr><w:jc w:val="left" /></w:pPr>${children.join("")}</w:p>`;

const body = (...paragraphs: string[]) => `<w:body>${paragraphs.join("")}</w:body>`;

/** A code-styled paragraph carrying real Grammarly-style before/after spacing. */
const codeParagraph = (text: string, before: number, after: number) =>
  `<w:p><w:pPr><w:spacing w:before="${before}" w:after="${after}" /></w:pPr>${run(text, true)}</w:p>`;

// Any code paragraph — either the plain "continues the previous line" style,
// or the "starts a new block" style startsNewCodeBlock chooses instead.
const isCode = (xml: string) => /<w:pStyle w:val="SourceCode(Start)?"\/>/.test(xml);
const startsCode = (xml: string) => xml.includes('<w:pStyle w:val="SourceCodeStart"/>');
const inlineCodeRuns = (xml: string) =>
  (xml.match(/<w:rStyle w:val="VerbatimChar"\/>/g) ?? []).length;

describe("preprocessDocumentXml", () => {
  it("styles an all-monospace paragraph as a code block", () => {
    const result = preprocessDocumentXml(body(paragraph(run("const x = 1;", true))));
    expect(isCode(result)).toBe(true);
  });

  it("leaves a prose paragraph unstyled", () => {
    const result = preprocessDocumentXml(body(paragraph(run("Just some prose."))));
    expect(isCode(result)).toBe(false);
    expect(inlineCodeRuns(result)).toBe(0);
  });

  it("styles a monospace run inside prose as inline code", () => {
    const result = preprocessDocumentXml(
      body(paragraph(run("Call "), run("readFile", true), run(" first.")))
    );

    expect(isCode(result)).toBe(false);
    expect(inlineCodeRuns(result)).toBe(1);
  });

  it("does not mistake a paragraph that mentions a font for one that uses it", () => {
    const result = preprocessDocumentXml(body(paragraph(run("Grammarly uses Courier New."))));
    expect(isCode(result)).toBe(false);
  });

  it("keeps a blank line between two code lines inside the block", () => {
    const result = preprocessDocumentXml(
      body(paragraph(run("first();", true)), paragraph(), paragraph(run("second();", true)))
    );

    // first() opens the block; the blank line and second() both continue it.
    expect(result.match(/<w:pStyle w:val="SourceCode(Start)?"\/>/g) ?? []).toHaveLength(3);
    expect(startsCode(result)).toBe(true);
    expect(result.match(/<w:pStyle w:val="SourceCode"\/>/g) ?? []).toHaveLength(2);
  });

  it("leaves a blank line between prose and code alone", () => {
    const result = preprocessDocumentXml(
      body(paragraph(run("Prose.")), paragraph(), paragraph(run("code();", true)))
    );

    // The blank line here belongs to neither paragraph, so code(); has nothing
    // to continue and opens its own (single-line) block.
    expect(isCode(result)).toBe(true);
    expect(startsCode(result)).toBe(true);
  });

  it("styles a self-closing empty paragraph between code lines", () => {
    const result = preprocessDocumentXml(
      body(paragraph(run("a();", true)), "<w:p />", paragraph(run("b();", true)))
    );

    expect(result).toContain('<w:p><w:pPr><w:pStyle w:val="SourceCode"/></w:pPr></w:p>');
  });

  it("styles a symmetrically indented paragraph as a block quote", () => {
    const quote =
      '<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>' + `${run("Wise words.")}</w:p>`;

    expect(preprocessDocumentXml(body(quote))).toContain('<w:pStyle w:val="GrammarlyBlockQuote"/>');
  });

  it("preserves everything it does not touch", () => {
    const xml = body(paragraph(run("Untouched.")));
    expect(preprocessDocumentXml(xml)).toBe(xml);
  });

  it("is idempotent", () => {
    const xml = body(paragraph(run("code();", true)), paragraph(run("Call "), run("x", true)));
    const once = preprocessDocumentXml(xml);
    expect(preprocessDocumentXml(once)).toBe(once);
  });

  it("keeps two single-line blocks written back to back as two separate blocks", () => {
    // No blank line, no prose, nothing at all between them — Grammarly's own
    // paragraph spacing (both sides at 200, the "standalone block" value) is
    // the only thing that tells them apart from one two-line block.
    const result = preprocessDocumentXml(
      body(codeParagraph("one();", 200, 200), codeParagraph("two();", 200, 200))
    );

    expect(result.match(/<w:pStyle w:val="SourceCodeStart"\/>/g) ?? []).toHaveLength(2);
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

describe("isBlockQuote", () => {
  const indented = (indent: string, properties = "") =>
    `<w:p><w:pPr>${properties}${indent}</w:pPr><w:r><w:t>x</w:t></w:r></w:p>`;

  it("is true for a paragraph indented from both margins", () => {
    expect(isBlockQuote(indented('<w:ind w:left="600" w:right="600" />'))).toBe(true);
  });

  it("is false for a list item, which is only indented from the left", () => {
    expect(
      isBlockQuote(
        indented(
          '<w:ind w:left="720" w:hanging="242" />',
          '<w:numPr><w:ilvl w:val="0" /><w:numId w:val="1" /></w:numPr>'
        )
      )
    ).toBe(false);
  });

  it("is false for an unindented paragraph", () => {
    expect(isBlockQuote(indented(""))).toBe(false);
  });

  it("is false for a paragraph that already has a style", () => {
    expect(
      isBlockQuote(
        indented('<w:ind w:left="600" w:right="600" />', '<w:pStyle w:val="Heading1" />')
      )
    ).toBe(false);
  });
});

describe("checklist detection", () => {
  const checkbox = (checked: boolean, checkedAttr = true) =>
    '<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:checkBox>' +
    '<w:default w:val="0" />' +
    (checkedAttr ? `<w:checked w:val="${checked ? "1" : "0"}" />` : "") +
    "</w:checkBox></w:ffData></w:fldChar></w:r>" +
    '<w:r><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r>' +
    '<w:r><w:fldChar w:fldCharType="end" /></w:r>';

  const item = (left: number, checked: boolean, checkedAttr = true) =>
    `<w:p><w:pPr><w:ind w:left="${left}" /></w:pPr>${checkbox(checked, checkedAttr)}${run("Task")}</w:p>`;

  it("recognises a paragraph carrying a FORMCHECKBOX field", () => {
    expect(isChecklistItem(item(720, false))).toBe(true);
  });

  it("does not mistake an ordinary paragraph for a checklist item", () => {
    expect(isChecklistItem(paragraph(run("Not a checklist.")))).toBe(false);
  });

  it("reads the checked state from <w:checked>", () => {
    expect(isChecked(item(720, true))).toBe(true);
    expect(isChecked(item(720, false))).toBe(false);
  });

  it("falls back to <w:default> when <w:checked> is absent", () => {
    const withoutChecked = item(720, false, false).replace(
      '<w:default w:val="0" />',
      '<w:default w:val="1" />'
    );
    expect(isChecked(withoutChecked)).toBe(true);
  });

  it("maps left indent to nesting level in 720-twip steps", () => {
    expect(checklistLevel(item(720, false))).toBe(0);
    expect(checklistLevel(item(1440, false))).toBe(1);
    expect(checklistLevel(item(2160, false))).toBe(2);
  });

  it("clamps an unindented checklist item to the top level", () => {
    expect(checklistLevel(paragraph(run("Task")))).toBe(0);
  });

  it("styles a checklist item with the style for its level, preserving the checkbox", () => {
    const result = preprocessDocumentXml(body(item(1440, true)));
    expect(result).toContain('<w:pStyle w:val="GrammarlyChecklist1"/>');
    expect(result).toContain("FORMCHECKBOX");
  });
});

describe("ensureStyles", () => {
  const empty = '<w:styles xmlns:w="urn:w"></w:styles>';

  it("declares every style the preprocessing pass references", () => {
    const result = ensureStyles(empty);
    expect(result).toContain('w:styleId="SourceCode"');
    expect(result).toContain('w:styleId="SourceCodeStart"');
    expect(result).toContain('w:styleId="VerbatimChar"');
    expect(result).toContain('w:styleId="GrammarlyBlockQuote"');
    expect(result).toContain('w:styleId="GrammarlyChecklist0"');
    expect(result).toContain('w:styleId="GrammarlyChecklist4"');
    expect(result).toEndWith("</w:styles>");
  });

  it("does not redeclare a style that is already there", () => {
    const once = ensureStyles(empty);
    expect(ensureStyles(once)).toBe(once);
  });
});

describe("preprocessDocx", () => {
  const docx = async (files: Record<string, string>): Promise<Uint8Array> => {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) zip.file(path, content);
    return zip.generateAsync({ type: "uint8array" });
  };

  it("rewrites the document and the styles in place", async () => {
    const bytes = await docx({
      "word/document.xml": body(paragraph(run("code();", true))),
      "word/styles.xml": '<w:styles xmlns:w="urn:w"></w:styles>'
    });

    const zip = await JSZip.loadAsync(await preprocessDocx(bytes));
    expect(await zip.file("word/document.xml")?.async("string")).toContain(
      '<w:pStyle w:val="SourceCodeStart"/>'
    );
    expect(await zip.file("word/styles.xml")?.async("string")).toContain(
      'w:styleId="SourceCodeStart"'
    );
  });

  it("creates word/styles.xml when the archive has none", async () => {
    const bytes = await docx({ "word/document.xml": body(paragraph(run("x"))) });
    const zip = await JSZip.loadAsync(await preprocessDocx(bytes));

    expect(await zip.file("word/styles.xml")?.async("string")).toContain(
      'w:styleId="VerbatimChar"'
    );
  });

  it("returns a zip without word/document.xml untouched", async () => {
    const bytes = await docx({ "hello.txt": "not a word document" });
    expect(await preprocessDocx(bytes)).toBe(bytes);
  });
});
