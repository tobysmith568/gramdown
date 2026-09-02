import { blockQuoteStyle, styleBlockQuotes } from "./block-quotes.js";
import { checklistStyles, styleChecklists } from "./checklists.js";
import { codeBlockStyles, styleCodeBlocks } from "./code-blocks.js";
import { inlineCodeStyle, styleInlineCode } from "./inline-code.js";
import type { StyleDescriptor } from "./style.js";

/** Every style any pass below might apply — the input to `ensureStyles`. */
export const PARAGRAPH_STYLES: StyleDescriptor[] = [
  ...codeBlockStyles,
  inlineCodeStyle,
  blockQuoteStyle,
  ...checklistStyles
];

/**
 * Restyle a Grammarly export's paragraphs so mammoth can see what pandoc-style
 * tools normally read from named styles: code blocks, inline code, checklists,
 * block quotes.
 *
 * Each pass is an independent, self-contained rewrite of the whole document —
 * none of them share state, so the only thing that matters about their order
 * is that a paragraph an earlier pass has already styled won't be mistaken for
 * one of a later pass's quirks. `code-blocks.ts` only ever touches monospace
 * paragraphs, and `block-quotes.ts` explicitly skips a paragraph that already
 * has a style, so in practice checklists and quotes never collide — but code
 * blocks are always resolved first regardless, since being entirely monospace
 * is the least ambiguous signal of the four.
 */
export const preprocessDocumentXml = (documentXml: string): string =>
  [styleCodeBlocks, styleInlineCode, styleChecklists, styleBlockQuotes].reduce(
    (xml, pass) => pass(xml),
    documentXml
  );
