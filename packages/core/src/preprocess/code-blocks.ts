import { PARAGRAPH_RE } from "../xml.js";
import { addParagraphStyle, classify, type Kind } from "./paragraph.js";
import { spacingTwip } from "./spacing.js";
import type { StyleDescriptor } from "./style.js";

const CODE_STYLE_ID = "SourceCode";
const CODE_START_STYLE_ID = "SourceCodeStart";

/**
 * The two styles mammoth maps to `<pre>`. `Source Code` merges with the
 * previous line via `:separator`; `Source Code Start` adds `:fresh`, mammoth's
 * way of saying "never merge this into the previous element even if it's the
 * same tag" — used for the first line of a block, so two blocks that sit
 * directly adjacent (see `startsNewCodeBlock`) don't collapse into one.
 */
export const codeBlockStyles: StyleDescriptor[] = [
  {
    id: CODE_STYLE_ID,
    name: "Source Code",
    type: "paragraph",
    htmlPath: "pre:separator('\n')"
  },
  {
    id: CODE_START_STYLE_ID,
    name: "Source Code Start",
    type: "paragraph",
    htmlPath: "pre:fresh:separator('\n')"
  }
];

/**
 * Which paragraphs end up inside a fenced block.
 *
 * A code block owns any blank paragraphs sitting between its lines, so that
 * internal blank lines stay part of one block instead of splitting it in two.
 */
export const codeBlockMembership = (kinds: Kind[]): boolean[] =>
  kinds.map((kind, index) => {
    if (kind === "code") return true;
    if (kind !== "empty") return false;

    let before = index - 1;
    while (before >= 0 && kinds[before] === "empty") before--;

    let after = index + 1;
    while (after < kinds.length && kinds[after] === "empty") after++;

    return kinds[before] === "code" && kinds[after] === "code";
  });

/**
 * Which of the paragraphs `codeBlockMembership` includes actually start a
 * *new* fenced block, as opposed to continuing the previous line's.
 *
 * Grammarly gives every code paragraph one of two paragraph-spacing values:
 * 100 twips before and after when it's an interior line of a block, and 200
 * on whichever side faces outside the block (the top of the first line, the
 * bottom of the last, or both on a single-line block). Two code blocks with
 * nothing but a blank paragraph between them are deliberately still one block
 * (`codeBlockMembership` already merges those, and that isn't touched here) —
 * but two written directly adjacent, with no blank line at all, are otherwise
 * indistinguishable from a single two-line block. This spacing is the only
 * signal Grammarly leaves behind to tell them apart.
 */
export const startsNewCodeBlock = (
  paragraphs: string[],
  kinds: Kind[],
  inCodeBlock: boolean[]
): boolean[] =>
  kinds.map((kind, index) => {
    if (kind !== "code") return false;

    const previous = index - 1;
    if (previous < 0 || !inCodeBlock[previous]) return true; // nothing to continue from
    if (kinds[previous] === "empty") return false; // blank-line-separated, still merges by design

    // kinds[previous] === "code": directly adjacent, no blank line at all — only
    // the spacing tells us whether this is really the same block or a new one.
    return (
      spacingTwip(paragraphs[previous] ?? "", "after") !== 100 ||
      spacingTwip(paragraphs[index] ?? "", "before") !== 100
    );
  });

/**
 * Restyle a Grammarly export's monospace paragraphs as code.
 *
 * Grammarly writes code as ordinary paragraphs set in Courier New — no style,
 * no language, no colours — and mammoth (like pandoc) reads named styles rather
 * than direct font formatting. So the fonts are translated into styles here,
 * before mammoth ever sees the file.
 */
export const styleCodeBlocks = (documentXml: string): string => {
  const paragraphs = [...documentXml.matchAll(PARAGRAPH_RE)].map(match => match[0]);
  const kinds = paragraphs.map(classify);
  const inCodeBlock = codeBlockMembership(kinds);
  const newBlock = startsNewCodeBlock(paragraphs, kinds, inCodeBlock);

  let index = 0;
  return documentXml.replace(PARAGRAPH_RE, paragraph => {
    const at = index++;
    if (!inCodeBlock[at]) return paragraph;
    return addParagraphStyle(paragraph, newBlock[at] ? CODE_START_STYLE_ID : CODE_STYLE_ID);
  });
};
