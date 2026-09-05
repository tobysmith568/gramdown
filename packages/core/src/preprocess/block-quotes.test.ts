import { describe, expect, it } from "bun:test";
import { isBlockQuote, styleBlockQuotes } from "./block-quotes";
import { body, run } from "./test-helpers";

describe("isBlockQuote", () => {
  const indented = (indent: string, properties = "") =>
    `<w:p><w:pPr>${properties}${indent}</w:pPr><w:r><w:t>x</w:t></w:r></w:p>`;

  it("is true for a paragraph indented from both margins", () => {
    const paragraph = indented('<w:ind w:left="600" w:right="600" />');

    const result = isBlockQuote(paragraph);

    expect(result).toBe(true);
  });

  it("is false for a list item, which is only indented from the left", () => {
    const paragraph = indented(
      '<w:ind w:left="720" w:hanging="242" />',
      '<w:numPr><w:ilvl w:val="0" /><w:numId w:val="1" /></w:numPr>'
    );

    const result = isBlockQuote(paragraph);

    expect(result).toBe(false);
  });

  it("is false for an unindented paragraph", () => {
    const paragraph = indented("");

    const result = isBlockQuote(paragraph);

    expect(result).toBe(false);
  });

  it("is false for a paragraph that already has a style", () => {
    const paragraph = indented(
      '<w:ind w:left="600" w:right="600" />',
      '<w:pStyle w:val="Heading1" />'
    );

    const result = isBlockQuote(paragraph);

    expect(result).toBe(false);
  });
});

describe("styleBlockQuotes", () => {
  it("styles a symmetrically indented paragraph as a block quote", () => {
    const quoteRun = run("Wise words.");
    const quote = `<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>${quoteRun}</w:p>`;
    const xml = body(quote);

    const result = styleBlockQuotes(xml);

    expect(result).toContain('<w:pStyle w:val="GrammarlyBlockQuote"/>');
  });

  it("leaves an unindented paragraph alone", () => {
    const proseRun = run("Ordinary prose.");
    const xml = body(`<w:p><w:pPr></w:pPr>${proseRun}</w:p>`);

    const result = styleBlockQuotes(xml);

    expect(result).toBe(xml);
  });
});
