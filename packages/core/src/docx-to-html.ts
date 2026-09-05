import mammoth from "mammoth";
import { paragraphStyles, styleMapEntry } from "./preprocess/index";

/**
 * Maps the styles the preprocessing pass injects (see `paragraphStyles`) onto
 * HTML, plus two mappings that aren't tied to any of our own injected styles:
 *
 * - `p[style-name='Quote']` — Word's own built-in "Quote" style, in case a
 *   document already uses it, independent of Grammarly's unstyled quotes.
 * - `u => u` re-enables underline, which mammoth drops by default. Word
 *   underlines link text automatically, so that noise is stripped again when
 *   the HTML is converted to Markdown — but underline used deliberately in
 *   prose survives.
 */
export const styleMap = [
  ...paragraphStyles.map(styleMapEntry),
  "p[style-name='Quote'] => blockquote > p:fresh",
  "u => u"
];

/**
 * A mammoth input that works in both its Node and browser builds: the Node
 * build looks for `buffer`, the browser build for `arrayBuffer`. Supplying both
 * keeps this module free of any environment detection.
 */
const inputFor = (bytes: Uint8Array) => {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return { buffer: bytes, arrayBuffer } as unknown as { arrayBuffer: ArrayBuffer };
};

export interface HtmlResult {
  html: string;
  warnings: string[];
}

/** Convert `.docx` bytes to mammoth's semantic HTML. */
export const docxToHtml = async (bytes: Uint8Array): Promise<HtmlResult> => {
  const mammothInput = inputFor(bytes);
  const result = await mammoth.convertToHtml(mammothInput, {
    styleMap,
    // Blank lines inside a code block arrive as empty paragraphs; dropping them
    // would silently close up the gaps in the code.
    ignoreEmptyParagraphs: false
  });

  return { html: result.value, warnings: result.messages.map(message => message.message) };
};
