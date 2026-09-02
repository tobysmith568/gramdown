import { describe, expect, it } from "bun:test";
import { PARAGRAPH_STYLES, preprocessDocumentXml } from "./document.js";
import { body, paragraph, run } from "./test-helpers.js";

describe("PARAGRAPH_STYLES", () => {
  it("aggregates every quirk's styles", () => {
    const ids = PARAGRAPH_STYLES.map(style => style.id);

    expect(ids).toContain("SourceCode");
    expect(ids).toContain("SourceCodeStart");
    expect(ids).toContain("VerbatimChar");
    expect(ids).toContain("GrammarlyBlockQuote");
    expect(ids).toContain("GrammarlyChecklist0");
    expect(ids).toContain("GrammarlyChecklist4");
  });

  it("has no duplicate ids", () => {
    const ids = PARAGRAPH_STYLES.map(style => style.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("preprocessDocumentXml", () => {
  it("applies every quirk to a document that mixes all of them", () => {
    const quote =
      '<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>' + `${run("Wise words.")}</w:p>`;

    const result = preprocessDocumentXml(
      body(
        paragraph(run("const x = 1;", true)),
        paragraph(run("Call "), run("readFile", true), run(" first.")),
        quote
      )
    );

    expect(result).toContain('<w:pStyle w:val="SourceCodeStart"/>');
    expect(result).toContain('<w:rStyle w:val="VerbatimChar"/>');
    expect(result).toContain('<w:pStyle w:val="GrammarlyBlockQuote"/>');
  });

  it("does not let block-quote detection retag a paragraph an earlier pass already styled", () => {
    // Symmetric indentation would otherwise satisfy isBlockQuote, but this
    // paragraph is a checklist item and should end up with exactly one style.
    const checklistItem =
      '<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>' +
      '<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:checkBox>' +
      '<w:checked w:val="0" /></w:checkBox></w:ffData></w:fldChar></w:r>' +
      '<w:r><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r>' +
      '<w:r><w:fldChar w:fldCharType="end" /></w:r>' +
      `${run("Task")}</w:p>`;

    const result = preprocessDocumentXml(body(checklistItem));

    expect(result.match(/<w:pStyle\b/g) ?? []).toHaveLength(1);
    expect(result).toContain('<w:pStyle w:val="GrammarlyChecklist0"/>');
  });

  it("is idempotent across the whole pipeline", () => {
    const xml = body(paragraph(run("code();", true)), paragraph(run("Call "), run("x", true)));
    const once = preprocessDocumentXml(xml);
    expect(preprocessDocumentXml(once)).toBe(once);
  });

  it("preserves a document none of the quirks apply to", () => {
    const xml = body(paragraph(run("Untouched.")));
    expect(preprocessDocumentXml(xml)).toBe(xml);
  });
});
