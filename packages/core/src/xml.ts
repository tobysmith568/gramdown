/**
 * Minimal regex helpers for walking the flat paragraph/run list in a Grammarly
 * `.docx`.
 *
 * A real XML parser would be more correct in general, but Grammarly's export is
 * a flat list of `<w:p>` elements with no tables, text boxes or other nesting,
 * and the preprocessing pass has to hand the XML back to mammoth byte-for-byte
 * identical apart from the styles it injects. Regex keeps that surgical.
 */

/** A `<w:p>…</w:p>` (or self-closing `<w:p/>`) containing no nested `<w:p>`. */
export const PARAGRAPH_RE =
  /<w:p(?:\s[^>]*)?\/>|<w:p(?:\s[^>]*)?>(?:(?!<w:p[\s/>])[\s\S])*?<\/w:p>/g;

/** A `<w:r>…</w:r>` (or self-closing `<w:r/>`) containing no nested `<w:r>`. */
export const RUN_RE = /<w:r(?:\s[^>]*)?\/>|<w:r(?:\s[^>]*)?>(?:(?!<w:r[\s/>])[\s\S])*?<\/w:r>/g;

const TEXT_RE = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

/** Every `<w:r>` in an element, in document order. */
export const runs = (xml: string): string[] => xml.match(RUN_RE) ?? [];

/** True if a run carries any `<w:t>` text (as opposed to a break, tab, drawing). */
export const hasText = (run: string): boolean => /<w:t[\s>]/.test(run);

/** The concatenated `<w:t>` content of an element, still XML-escaped. */
export const textOf = (xml: string): string =>
  [...xml.matchAll(TEXT_RE)].map(match => match[1] ?? "").join("");

/**
 * The run properties block of a run — `<w:rPr>…</w:rPr>` — or `""` if it has
 * none. Only the run's own properties are considered, never the text content,
 * so a paragraph that merely *mentions* a font name is not mistaken for one
 * that *uses* it.
 */
export const runProperties = (run: string): string => {
  const match = /<w:rPr(?:\s[^>]*)?>[\s\S]*?<\/w:rPr>|<w:rPr(?:\s[^>]*)?\/>/.exec(run);
  return match?.[0] ?? "";
};

/**
 * The paragraph properties block of a paragraph — `<w:pPr>…</w:pPr>` — or `""`
 * if it has none.
 */
export const paragraphProperties = (paragraph: string): string => {
  const match = /<w:pPr(?:\s[^>]*)?>[\s\S]*?<\/w:pPr>|<w:pPr(?:\s[^>]*)?\/>/.exec(paragraph);
  return match?.[0] ?? "";
};
