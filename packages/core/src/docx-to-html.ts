import mammoth from "mammoth";
import {
  CODE_START_STYLE_NAME,
  CODE_STYLE_NAME,
  INLINE_CODE_STYLE_NAME,
  MAX_CHECKLIST_LEVEL,
  QUOTE_STYLE_NAME,
  checklistStyleName
} from "./preprocess.js";

/**
 * A `ul > li` path nested `level` lists deep, in the same shape mammoth's own
 * default style map uses for `p:unordered-list(N)` / `p:ordered-list(N)`.
 */
const nestedListItemPath = (level: number): string =>
  `${"ul|ol > li > ".repeat(level)}ul > li:fresh`;

/** One `p[style-name=…] => …` mapping per checklist nesting depth we declare. */
const checklistStyleMap = Array.from({ length: MAX_CHECKLIST_LEVEL }, (_, level) => {
  const name = checklistStyleName(level);
  return `p[style-name='${name}'] => ${nestedListItemPath(level)}`;
});

/**
 * Maps the styles injected by the preprocessing pass onto HTML.
 *
 * `:separator('\n')` tells mammoth to collapse a run of consecutive code
 * paragraphs into a single `<pre>` with newlines between them, rather than one
 * `<pre>` per line. `Source Code Start` adds `:fresh`, which is mammoth's way
 * of saying "never merge this into the previous element even if it's the same
 * tag" — used for the first line of a block, so two blocks that sit directly
 * adjacent (see `startsNewCodeBlock` in preprocess.ts) stay two `<pre>`s.
 *
 * `u => u` re-enables underline, which mammoth drops by default. Word underlines
 * link text automatically, so that noise is stripped again when the HTML is
 * converted to Markdown — but underline used deliberately in prose survives.
 *
 * Checklist items need no mapping for the checkbox itself — mammoth already
 * turns Word's `FORMCHECKBOX` field into `<input type="checkbox">` on its own;
 * the mapping only needs to put that `<input>` inside an `<li>` so turndown's
 * GFM plugin recognises it as a task-list item.
 */
export const STYLE_MAP = [
  `p[style-name='${CODE_STYLE_NAME}'] => pre:separator('\n')`,
  `p[style-name='${CODE_START_STYLE_NAME}'] => pre:fresh:separator('\n')`,
  `r[style-name='${INLINE_CODE_STYLE_NAME}'] => code`,
  `p[style-name='${QUOTE_STYLE_NAME}'] => blockquote > p:fresh`,
  "p[style-name='Quote'] => blockquote > p:fresh",
  ...checklistStyleMap,
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
  const result = await mammoth.convertToHtml(inputFor(bytes), {
    styleMap: STYLE_MAP,
    // Blank lines inside a code block arrive as empty paragraphs; dropping them
    // would silently close up the gaps in the code.
    ignoreEmptyParagraphs: false
  });

  return { html: result.value, warnings: result.messages.map(message => message.message) };
};
