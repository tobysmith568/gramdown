import JSZip from "jszip";
import {
  PARAGRAPH_RE,
  RUN_RE,
  hasText,
  paragraphProperties,
  runProperties,
  runs,
  textOf
} from "./xml.js";

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

/** Paragraph style mammoth maps to `<pre>`, merging with the previous line. */
export const CODE_STYLE_ID = "SourceCode";
export const CODE_STYLE_NAME = "Source Code";

/**
 * Paragraph style mammoth maps to a *new* `<pre>` — used for the first line of
 * a code block, so that two blocks sitting back to back with no blank line
 * between them (see `startsNewCodeBlock`) don't merge into one.
 */
export const CODE_START_STYLE_ID = "SourceCodeStart";
export const CODE_START_STYLE_NAME = "Source Code Start";

/** Character style mammoth maps to `<code>`. */
export const INLINE_CODE_STYLE_ID = "VerbatimChar";
export const INLINE_CODE_STYLE_NAME = "Verbatim Char";

/** Paragraph style mammoth maps to `<blockquote>`. */
export const QUOTE_STYLE_ID = "GrammarlyBlockQuote";
export const QUOTE_STYLE_NAME = "Block Quote";

/**
 * Paragraph styles mammoth maps to a task-list item, one per nesting depth
 * (mirroring mammoth's own default map, which supports up to 5 levels of
 * ordinary list).
 */
export const CHECKLIST_STYLE_PREFIX = "GrammarlyChecklist";
export const CHECKLIST_STYLE_NAME_PREFIX = "Checklist Level ";
export const MAX_CHECKLIST_LEVEL = 5;
export const checklistStyleId = (level: number): string => `${CHECKLIST_STYLE_PREFIX}${level}`;
export const checklistStyleName = (level: number): string =>
  `${CHECKLIST_STYLE_NAME_PREFIX}${level}`;

const R_STYLE = `<w:rStyle w:val="${INLINE_CODE_STYLE_ID}"/>`;

const DOCUMENT_PATH = "word/document.xml";
const STYLES_PATH = "word/styles.xml";

type Kind = "code" | "empty" | "other";

const FONT_ATTR_RE = /<w:rFonts\b[^>]*>/g;

/** True if a run's *properties* set one of the monospace fonts. */
const isMonospace = (run: string): boolean => {
  const fonts = runProperties(run).match(FONT_ATTR_RE) ?? [];
  return fonts.some(font => MONOSPACE_FONTS.some(name => font.includes(`"${name}"`)));
};

const classify = (paragraph: string): Kind => {
  const textRuns = runs(paragraph).filter(hasText);
  if (textRuns.length === 0 || textOf(paragraph).trim() === "") return "empty";
  return textRuns.every(isMonospace) ? "code" : "other";
};

const INDENT_RE = /<w:ind\b[^>]*>/;
const SPACING_RE = /<w:spacing\b[^>]*>/;
const twip = (tag: string, side: string): number =>
  Number(new RegExp(`w:${side}="(\\d+)"`).exec(tag)?.[1] ?? 0);
const spacingTwip = (paragraph: string, side: string): number =>
  twip(SPACING_RE.exec(paragraphProperties(paragraph))?.[0] ?? "", side);

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

const addParagraphStyle = (paragraph: string, styleId: string): string => {
  const style = `<w:pStyle w:val="${styleId}"/>`;
  if (paragraph.includes(style)) return paragraph;
  if (paragraph.includes("<w:pPr>")) return paragraph.replace("<w:pPr>", `<w:pPr>${style}`);
  if (paragraph.includes("<w:pPr/>")) {
    return paragraph.replace("<w:pPr/>", `<w:pPr>${style}</w:pPr>`);
  }
  if (/^<w:p(?:\s[^>]*)?\/>$/.test(paragraph)) return `<w:p><w:pPr>${style}</w:pPr></w:p>`;
  return paragraph.replace(/^<w:p(?:\s[^>]*)?>/, open => `${open}<w:pPr>${style}</w:pPr>`);
};

const tagInlineCode = (paragraph: string): string =>
  paragraph.replace(RUN_RE, run => {
    if (!hasText(run) || !isMonospace(run) || run.includes(R_STYLE)) return run;
    if (run.includes("<w:rPr>")) return run.replace("<w:rPr>", `<w:rPr>${R_STYLE}`);
    if (run.includes("<w:rPr/>")) return run.replace("<w:rPr/>", `<w:rPr>${R_STYLE}</w:rPr>`);
    return run.replace(/^<w:r(?:\s[^>]*)?>/, open => `${open}<w:rPr>${R_STYLE}</w:rPr>`);
  });

/**
 * True if a paragraph is one of Grammarly's block quotes.
 *
 * Grammarly gives a quote no style — it just indents the paragraph equally from
 * both margins, which mammoth (reading styles, not direct formatting) cannot
 * see. List items are indented too, but only from the left, and they carry a
 * `<w:numPr>`.
 */
export const isBlockQuote = (paragraph: string): boolean => {
  const properties = paragraphProperties(paragraph);
  if (properties.includes("<w:numPr") || properties.includes("<w:pStyle")) return false;

  const indent = INDENT_RE.exec(properties)?.[0];
  if (!indent || indent.includes("w:hanging")) return false;

  return twip(indent, "left") > 0 && twip(indent, "right") > 0;
};

/**
 * True if a paragraph is one of Grammarly's checklist items.
 *
 * Grammarly emits these as a legacy Word form-field checkbox (`FORMCHECKBOX`)
 * followed by the item's text — no `<w:numPr>`, so nothing marks the paragraph
 * as a list item at all. Its "collapsible list" variant is indistinguishable
 * from a plain bulleted list once exported, so there is nothing to detect there.
 */
export const isChecklistItem = (paragraph: string): boolean => paragraph.includes("FORMCHECKBOX");

const readBoolean = (xml: string, tag: string): boolean | undefined => {
  const match = new RegExp(`<w:${tag}(?:\\s+w:val="([^"]*)")?\\s*/>`).exec(xml);
  if (!match) return undefined;
  const value = match[1];
  return value === undefined || (value !== "0" && value.toLowerCase() !== "false");
};

/** Whether a checklist item is ticked, following the same default-then-checked
 * fallback as the `<w:checkBox>` form field itself. */
export const isChecked = (paragraph: string): boolean => {
  const checkbox = /<w:checkBox>([\s\S]*?)<\/w:checkBox>/.exec(paragraph)?.[1];
  if (checkbox === undefined) return false;
  return readBoolean(checkbox, "checked") ?? readBoolean(checkbox, "default") ?? false;
};

const CHECKLIST_INDENT_STEP = 720; // twips per level — matches Grammarly's own step

/** How deeply a checklist item is nested, clamped to what we declare styles for. */
export const checklistLevel = (paragraph: string): number => {
  const indent = INDENT_RE.exec(paragraphProperties(paragraph))?.[0] ?? "";
  const level = Math.round(twip(indent, "left") / CHECKLIST_INDENT_STEP) - 1;
  return Math.min(Math.max(level, 0), MAX_CHECKLIST_LEVEL - 1);
};

/** Declare the styles we reference, so mammoth can resolve them by name. */
export const ensureStyles = (stylesXml: string): string => {
  const additions: string[] = [];

  if (!stylesXml.includes(`w:styleId="${CODE_STYLE_ID}"`)) {
    additions.push(
      `<w:style w:type="paragraph" w:styleId="${CODE_STYLE_ID}">` +
        `<w:name w:val="${CODE_STYLE_NAME}"/><w:qFormat/></w:style>`
    );
  }

  if (!stylesXml.includes(`w:styleId="${CODE_START_STYLE_ID}"`)) {
    additions.push(
      `<w:style w:type="paragraph" w:styleId="${CODE_START_STYLE_ID}">` +
        `<w:name w:val="${CODE_START_STYLE_NAME}"/><w:qFormat/></w:style>`
    );
  }

  if (!stylesXml.includes(`w:styleId="${INLINE_CODE_STYLE_ID}"`)) {
    additions.push(
      `<w:style w:type="character" w:styleId="${INLINE_CODE_STYLE_ID}">` +
        `<w:name w:val="${INLINE_CODE_STYLE_NAME}"/><w:qFormat/></w:style>`
    );
  }

  if (!stylesXml.includes(`w:styleId="${QUOTE_STYLE_ID}"`)) {
    additions.push(
      `<w:style w:type="paragraph" w:styleId="${QUOTE_STYLE_ID}">` +
        `<w:name w:val="${QUOTE_STYLE_NAME}"/><w:qFormat/></w:style>`
    );
  }

  for (let level = 0; level < MAX_CHECKLIST_LEVEL; level++) {
    const styleId = checklistStyleId(level);
    if (stylesXml.includes(`w:styleId="${styleId}"`)) continue;
    additions.push(
      `<w:style w:type="paragraph" w:styleId="${styleId}">` +
        `<w:name w:val="${checklistStyleName(level)}"/><w:qFormat/></w:style>`
    );
  }

  if (additions.length === 0) return stylesXml;
  return stylesXml.replace("</w:styles>", `${additions.join("")}</w:styles>`);
};

/**
 * Restyle a Grammarly export's monospace paragraphs and runs as code.
 *
 * Grammarly writes code as ordinary paragraphs set in Courier New — no style,
 * no language, no colours — and mammoth (like pandoc) reads named styles rather
 * than direct font formatting. So the fonts are translated into styles here,
 * before mammoth ever sees the file.
 */
export const preprocessDocumentXml = (documentXml: string): string => {
  const paragraphs = [...documentXml.matchAll(PARAGRAPH_RE)].map(match => match[0]);
  const kinds = paragraphs.map(classify);
  const inCodeBlock = codeBlockMembership(kinds);
  const newCodeBlock = startsNewCodeBlock(paragraphs, kinds, inCodeBlock);

  let index = 0;
  return documentXml.replace(PARAGRAPH_RE, paragraph => {
    const at = index++;
    if (inCodeBlock[at]) {
      return addParagraphStyle(paragraph, newCodeBlock[at] ? CODE_START_STYLE_ID : CODE_STYLE_ID);
    }
    if (kinds[at] !== "other") return paragraph;

    const tagged = tagInlineCode(paragraph);
    if (isChecklistItem(tagged)) {
      return addParagraphStyle(tagged, checklistStyleId(checklistLevel(tagged)));
    }
    return isBlockQuote(tagged) ? addParagraphStyle(tagged, QUOTE_STYLE_ID) : tagged;
  });
};

/**
 * Rewrite a `.docx` in memory so its code is expressed as styles.
 *
 * Returns the original bytes untouched if the archive does not look like a Word
 * document (no `word/document.xml`); a missing `word/styles.xml` is created.
 */
export const preprocessDocx = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const zip = await JSZip.loadAsync(bytes);

  const documentFile = zip.file(DOCUMENT_PATH);
  if (!documentFile) return bytes;

  zip.file(DOCUMENT_PATH, preprocessDocumentXml(await documentFile.async("string")));

  const stylesFile = zip.file(STYLES_PATH);
  const stylesXml = stylesFile
    ? await stylesFile.async("string")
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "</w:styles>";
  zip.file(STYLES_PATH, ensureStyles(stylesXml));

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
};
