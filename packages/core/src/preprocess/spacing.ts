import { paragraphProperties } from "../xml";

const indentRe = /<w:ind\b[^>]*>/;
const spacingRe = /<w:spacing\b[^>]*>/;

const attrTwip = (tag: string, side: string): number =>
  Number(new RegExp(`w:${side}="(\\d+)"`).exec(tag)?.[1] ?? 0);

/** The raw `<w:ind …>` tag on a paragraph, or "" if it has none. */
export const indentTag = (paragraph: string): string => {
  const properties = paragraphProperties(paragraph);
  return indentRe.exec(properties)?.[0] ?? "";
};

/** The `<w:ind w:{side}="…">` value on a paragraph, in twips (0 if absent). */
export const indentTwip = (paragraph: string, side: "left" | "right"): number => {
  const indent = indentTag(paragraph);
  return attrTwip(indent, side);
};

/** The `<w:spacing w:{side}="…">` value on a paragraph, in twips (0 if absent). */
export const spacingTwip = (paragraph: string, side: "before" | "after"): number => {
  const properties = paragraphProperties(paragraph);
  const spacingTag = spacingRe.exec(properties)?.[0] ?? "";
  return attrTwip(spacingTag, side);
};
