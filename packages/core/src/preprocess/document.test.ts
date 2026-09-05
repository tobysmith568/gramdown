import { describe, expect, it } from "bun:test";
import { paragraphStyles, preprocessDocumentXml } from "./document";
import { body, line, paragraph, run } from "./test-helpers";

describe("paragraphStyles", () => {
  it("aggregates every quirk's styles", () => {
    const ids = paragraphStyles.map(style => style.id);

    expect(ids).toContain("SourceCode");
    expect(ids).toContain("SourceCodeStart");
    expect(ids).toContain("VerbatimChar");
    expect(ids).toContain("GrammarlyBlockQuote");
    expect(ids).toContain("GrammarlyChecklist0");
    expect(ids).toContain("GrammarlyChecklist4");
  });

  it("has no duplicate ids", () => {
    const ids = paragraphStyles.map(style => style.id);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });
});

describe("preprocessDocumentXml", () => {
  it("applies every quirk to a document that mixes all of them", () => {
    const quoteRun = run("Wise words.");
    const quote = `<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>${quoteRun}</w:p>`;
    const codePara = line("const x = 1;", true);
    const callRun = run("Call ");
    const codeRun = run("readFile", true);
    const restRun = run(" first.");
    const inlineCodePara = paragraph(callRun, codeRun, restRun);
    const xml = body(codePara, inlineCodePara, quote);

    const result = preprocessDocumentXml(xml);

    expect(result).toContain('<w:pStyle w:val="SourceCodeStart"/>');
    expect(result).toContain('<w:rStyle w:val="VerbatimChar"/>');
    expect(result).toContain('<w:pStyle w:val="GrammarlyBlockQuote"/>');
  });

  it("does not let block-quote detection retag a paragraph an earlier pass already styled", () => {
    // Symmetric indentation would otherwise satisfy isBlockQuote, but this
    // paragraph is a checklist item and should end up with exactly one style.
    const taskRun = run("Task");
    const checklistItem =
      '<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>' +
      '<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:checkBox>' +
      '<w:checked w:val="0" /></w:checkBox></w:ffData></w:fldChar></w:r>' +
      '<w:r><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r>' +
      '<w:r><w:fldChar w:fldCharType="end" /></w:r>' +
      `${taskRun}</w:p>`;
    const xml = body(checklistItem);

    const result = preprocessDocumentXml(xml);
    const styleMarkers = result.match(/<w:pStyle\b/g) ?? [];

    expect(styleMarkers).toHaveLength(1);
    expect(result).toContain('<w:pStyle w:val="GrammarlyChecklist0"/>');
  });

  it("is idempotent across the whole pipeline", () => {
    const codePara = line("code();", true);
    const callRun = run("Call ");
    const codeRun = run("x", true);
    const inlineCodePara = paragraph(callRun, codeRun);
    const xml = body(codePara, inlineCodePara);

    const once = preprocessDocumentXml(xml);
    const twice = preprocessDocumentXml(once);

    expect(twice).toBe(once);
  });

  it("preserves a document none of the quirks apply to", () => {
    const prosePara = line("Untouched.");
    const xml = body(prosePara);

    const result = preprocessDocumentXml(xml);

    expect(result).toBe(xml);
  });
});
