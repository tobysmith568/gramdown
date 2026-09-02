import { RUN_RE, hasText } from "../xml.js";
import { isMonospace } from "./monospace.js";
import { mapOtherParagraphs } from "./paragraph.js";
import type { StyleDescriptor } from "./style.js";

const INLINE_CODE_STYLE_ID = "VerbatimChar";

/** The character style mammoth maps to `<code>`. */
export const inlineCodeStyle: StyleDescriptor = {
  id: INLINE_CODE_STYLE_ID,
  name: "Verbatim Char",
  type: "character",
  htmlPath: "code"
};

const R_STYLE = `<w:rStyle w:val="${INLINE_CODE_STYLE_ID}"/>`;

const tagInlineCode = (paragraph: string): string =>
  paragraph.replace(RUN_RE, run => {
    if (!hasText(run) || !isMonospace(run) || run.includes(R_STYLE)) return run;
    if (run.includes("<w:rPr>")) return run.replace("<w:rPr>", `<w:rPr>${R_STYLE}`);
    if (run.includes("<w:rPr/>")) return run.replace("<w:rPr/>", `<w:rPr>${R_STYLE}</w:rPr>`);
    return run.replace(/^<w:r(?:\s[^>]*)?>/, open => `${open}<w:rPr>${R_STYLE}</w:rPr>`);
  });

/**
 * Tag monospace runs inside ordinary prose paragraphs as inline code.
 *
 * A paragraph that's *entirely* monospace is a code block (see
 * code-blocks.ts) and never reaches this pass — only a monospace run mixed
 * into otherwise-normal prose counts as inline code.
 */
export const styleInlineCode = (documentXml: string): string =>
  mapOtherParagraphs(documentXml, tagInlineCode);
