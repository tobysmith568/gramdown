import { describe, expect, it } from "bun:test";
import { isBlockQuote, styleBlockQuotes } from "./block-quotes.js";
import { body, run } from "./test-helpers.js";

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

describe("styleBlockQuotes", () => {
  it("styles a symmetrically indented paragraph as a block quote", () => {
    const quote =
      '<w:p><w:pPr><w:ind w:left="600" w:right="600" /></w:pPr>' + `${run("Wise words.")}</w:p>`;

    expect(styleBlockQuotes(body(quote))).toContain('<w:pStyle w:val="GrammarlyBlockQuote"/>');
  });

  it("leaves an unindented paragraph alone", () => {
    const xml = body(`<w:p><w:pPr></w:pPr>${run("Ordinary prose.")}</w:p>`);
    expect(styleBlockQuotes(xml)).toBe(xml);
  });
});
