import { addParagraphStyle, mapOtherParagraphs } from "./paragraph";
import { indentTwip } from "./spacing";
import type { StyleDescriptor } from "./style";

const CHECKLIST_STYLE_PREFIX = "GrammarlyChecklist";
const MAX_CHECKLIST_LEVEL = 5;

const checklistStyleId = (level: number): string => `${CHECKLIST_STYLE_PREFIX}${level}`;

/** A `ul > li` path nested `level` lists deep, matching the shape mammoth's own
 * default style map uses for `p:unordered-list(N)` / `p:ordered-list(N)`. */
const nestedListItemPath = (level: number): string =>
  `${"ul|ol > li > ".repeat(level)}ul > li:fresh`;

/**
 * Paragraph styles mammoth maps to a task-list item, one per nesting depth
 * (mirroring mammoth's own default map, which supports up to 5 levels of
 * ordinary list). Checklist items need no mapping for the checkbox itself —
 * mammoth already turns Word's `FORMCHECKBOX` field into
 * `<input type="checkbox">` on its own; these mappings only need to put that
 * `<input>` inside an `<li>` so turndown's GFM plugin recognises it as a
 * task-list item.
 */
export const checklistStyles: StyleDescriptor[] = Array.from(
  { length: MAX_CHECKLIST_LEVEL },
  (_, level) => ({
    id: checklistStyleId(level),
    name: `Checklist Level ${level}`,
    type: "paragraph",
    htmlPath: nestedListItemPath(level)
  })
);

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

/**
 * Whether a checklist item is ticked, following the same default-then-checked
 * fallback as the `<w:checkBox>` form field itself.
 */
export const isChecked = (paragraph: string): boolean => {
  const checkbox = /<w:checkBox>([\s\S]*?)<\/w:checkBox>/.exec(paragraph)?.[1];
  if (checkbox === undefined) return false;
  return readBoolean(checkbox, "checked") ?? readBoolean(checkbox, "default") ?? false;
};

const CHECKLIST_INDENT_STEP = 720; // twips per level — matches Grammarly's own step

/** How deeply a checklist item is nested, clamped to what we declare styles for. */
export const checklistLevel = (paragraph: string): number => {
  const level = Math.round(indentTwip(paragraph, "left") / CHECKLIST_INDENT_STEP) - 1;
  return Math.min(Math.max(level, 0), MAX_CHECKLIST_LEVEL - 1);
};

/** Restyle Grammarly's checklist items as GFM task-list items, at their nesting depth. */
export const styleChecklists = (documentXml: string): string =>
  mapOtherParagraphs(documentXml, paragraph =>
    isChecklistItem(paragraph)
      ? addParagraphStyle(paragraph, checklistStyleId(checklistLevel(paragraph)))
      : paragraph
  );
