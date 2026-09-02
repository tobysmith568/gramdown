import { runProperties } from "../xml";

/**
 * Fonts Grammarly (and Word) use for code. Grammarly only ever emits "Courier
 * New"; the rest are here so a docx that has been through Word on its way out
 * still converts.
 */
export const MONOSPACE_FONTS = [
  "Courier New",
  "Courier",
  "Consolas",
  "Menlo",
  "Monaco",
  "Cascadia Mono",
  "Lucida Console"
];

const FONT_ATTR_RE = /<w:rFonts\b[^>]*>/g;

/** True if a run's *properties* set one of the monospace fonts. */
export const isMonospace = (run: string): boolean => {
  const fonts = runProperties(run).match(FONT_ATTR_RE) ?? [];
  return fonts.some(font => MONOSPACE_FONTS.some(name => font.includes(`"${name}"`)));
};
