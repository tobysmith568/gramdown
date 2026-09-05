import { runProperties } from "../xml";

/**
 * Fonts Grammarly (and Word) use for code. Grammarly only ever emits "Courier
 * New"; the rest are here so a docx that has been through Word on its way out
 * still converts.
 */
export const monospaceFonts = [
  "Courier New",
  "Courier",
  "Consolas",
  "Menlo",
  "Monaco",
  "Cascadia Mono",
  "Lucida Console"
];

const fontAttrRe = /<w:rFonts\b[^>]*>/g;

/** True if a run's *properties* set one of the monospace fonts. */
export const isMonospace = (run: string): boolean => {
  const fonts = runProperties(run).match(fontAttrRe) ?? [];
  return fonts.some(font => monospaceFonts.some(name => font.includes(`"${name}"`)));
};
