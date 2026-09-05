import { paragraphRe, hasText, runs, textOf } from "../xml";
import { isMonospace } from "./monospace";

export type Kind = "code" | "empty" | "other";

/** Classify a paragraph as blank, all-monospace ("code"), or ordinary prose. */
export const classify = (paragraph: string): Kind => {
  const textRuns = runs(paragraph).filter(hasText);
  if (textRuns.length === 0 || textOf(paragraph).trim() === "") {
    return "empty";
  }
  return textRuns.every(isMonospace) ? "code" : "other";
};

/**
 * Insert a `<w:pStyle>` into a paragraph's `<w:pPr>`, creating one if the
 * paragraph doesn't have properties yet. A no-op if the paragraph already
 * carries this exact style.
 */
export const addParagraphStyle = (paragraph: string, styleId: string): string => {
  const style = `<w:pStyle w:val="${styleId}"/>`;
  if (paragraph.includes(style)) {
    return paragraph;
  }
  if (paragraph.includes("<w:pPr>")) {
    return paragraph.replace("<w:pPr>", `<w:pPr>${style}`);
  }
  if (paragraph.includes("<w:pPr/>")) {
    return paragraph.replace("<w:pPr/>", `<w:pPr>${style}</w:pPr>`);
  }
  if (/^<w:p(?:\s[^>]*)?\/>$/.test(paragraph)) {
    return `<w:p><w:pPr>${style}</w:pPr></w:p>`;
  }
  return paragraph.replace(/^<w:p(?:\s[^>]*)?>/, open => `${open}<w:pPr>${style}</w:pPr>`);
};

/**
 * Rewrite only the paragraphs classified as ordinary prose ("other") —
 * code-block and blank paragraphs pass through untouched.
 *
 * Every quirk that only ever looks at prose (inline code, checklists, block
 * quotes) is built on this, so each of those passes is a single independent
 * scan of the document rather than needing the whole-document `kinds` array
 * threaded in from outside.
 */
export const mapOtherParagraphs = (
  documentXml: string,
  transform: (paragraph: string) => string
): string => {
  const kinds = [...documentXml.matchAll(paragraphRe)].map(match => classify(match[0]));

  let index = 0;
  return documentXml.replace(paragraphRe, paragraph =>
    kinds[index++] === "other" ? transform(paragraph) : paragraph
  );
};
