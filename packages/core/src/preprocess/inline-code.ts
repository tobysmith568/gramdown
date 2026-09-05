import { runRe, hasText } from "../xml";
import { isMonospace } from "./monospace";
import { mapOtherParagraphs } from "./paragraph";
import type { StyleDescriptor } from "./style";

const inlineCodeStyleId = "VerbatimChar";

/** The character style mammoth maps to `<code>`. */
export const inlineCodeStyle: StyleDescriptor = {
  id: inlineCodeStyleId,
  name: "Verbatim Char",
  type: "character",
  htmlPath: "code"
};

const rStyle = `<w:rStyle w:val="${inlineCodeStyleId}"/>`;

const tagInlineCode = (paragraph: string): string =>
  paragraph.replace(runRe, run => {
    if (!hasText(run) || !isMonospace(run) || run.includes(rStyle)) {
      return run;
    }
    if (run.includes("<w:rPr>")) {
      return run.replace("<w:rPr>", `<w:rPr>${rStyle}`);
    }
    if (run.includes("<w:rPr/>")) {
      return run.replace("<w:rPr/>", `<w:rPr>${rStyle}</w:rPr>`);
    }
    return run.replace(/^<w:r(?:\s[^>]*)?>/, open => `${open}<w:rPr>${rStyle}</w:rPr>`);
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
