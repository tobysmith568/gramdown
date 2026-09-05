import { paragraphProperties } from "../xml";
import { addParagraphStyle, mapOtherParagraphs } from "./paragraph";
import { indentTag, indentTwip } from "./spacing";
import type { StyleDescriptor } from "./style";

const quoteStyleId = "GrammarlyBlockQuote";

/** The paragraph style mammoth maps to `<blockquote>`. */
export const blockQuoteStyle: StyleDescriptor = {
  id: quoteStyleId,
  name: "Block Quote",
  type: "paragraph",
  htmlPath: "blockquote > p:fresh"
};

/**
 * True if a paragraph is one of Grammarly's block quotes.
 *
 * Grammarly gives a quote no style — it just indents the paragraph equally from
 * both margins, which mammoth (reading styles, not direct formatting) cannot
 * see. List items are indented too, but only from the left, and they carry a
 * `<w:numPr>`. A paragraph an earlier pass has already styled (a heading, a
 * checklist item) is left alone too, rather than risk a false positive.
 */
export const isBlockQuote = (paragraph: string): boolean => {
  const properties = paragraphProperties(paragraph);
  if (properties.includes("<w:numPr") || properties.includes("<w:pStyle")) {
    return false;
  }

  const indent = indentTag(paragraph);
  if (!indent || indent.includes("w:hanging")) {
    return false;
  }

  return indentTwip(paragraph, "left") > 0 && indentTwip(paragraph, "right") > 0;
};

/** Restyle Grammarly's block quotes so mammoth can see them. */
export const styleBlockQuotes = (documentXml: string): string =>
  mapOtherParagraphs(documentXml, paragraph =>
    isBlockQuote(paragraph) ? addParagraphStyle(paragraph, quoteStyleId) : paragraph
  );
