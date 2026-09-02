import { paragraphProperties } from "../xml.js";

const INDENT_RE = /<w:ind\b[^>]*>/;
const SPACING_RE = /<w:spacing\b[^>]*>/;

const attrTwip = (tag: string, side: string): number =>
  Number(new RegExp(`w:${side}="(\\d+)"`).exec(tag)?.[1] ?? 0);

/** The raw `<w:ind …>` tag on a paragraph, or "" if it has none. */
export const indentTag = (paragraph: string): string =>
  INDENT_RE.exec(paragraphProperties(paragraph))?.[0] ?? "";

/** The `<w:ind w:{side}="…">` value on a paragraph, in twips (0 if absent). */
export const indentTwip = (paragraph: string, side: "left" | "right"): number =>
  attrTwip(indentTag(paragraph), side);

/** The `<w:spacing w:{side}="…">` value on a paragraph, in twips (0 if absent). */
export const spacingTwip = (paragraph: string, side: "before" | "after"): number =>
  attrTwip(SPACING_RE.exec(paragraphProperties(paragraph))?.[0] ?? "", side);
