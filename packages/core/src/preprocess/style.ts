/**
 * A paragraph or character style this preprocessing pass injects into a
 * Grammarly export, together with everything both ends of the pipeline need
 * to know about it: `ensureStyles` (below) uses `id`/`name`/`type` to declare
 * it in `word/styles.xml`; `docx-to-html.ts` uses `name`/`type`/`htmlPath` to
 * map it onto HTML in mammoth's style map. Keeping both here, exported by the
 * same module that decides which paragraphs get the style, means a new quirk
 * only has to be registered once — see document.ts's `PARAGRAPH_STYLES`.
 */
export interface StyleDescriptor {
  readonly id: string;
  readonly name: string;
  readonly type: "paragraph" | "character";
  /** The right-hand side of a mammoth style-map rule, e.g. `pre:separator('\n')`. */
  readonly htmlPath: string;
}

/** Declare every style in `styles` that `stylesXml` doesn't already have. */
export const ensureStyles = (stylesXml: string, styles: readonly StyleDescriptor[]): string => {
  const additions = styles
    .filter(style => !stylesXml.includes(`w:styleId="${style.id}"`))
    .map(
      style =>
        `<w:style w:type="${style.type}" w:styleId="${style.id}">` +
        `<w:name w:val="${style.name}"/><w:qFormat/></w:style>`
    );

  if (additions.length === 0) return stylesXml;
  return stylesXml.replace("</w:styles>", `${additions.join("")}</w:styles>`);
};

/** The mammoth style-map rule for one descriptor — `p[style-name=…] => …` or `r[…] => …`. */
export const styleMapEntry = (style: StyleDescriptor): string => {
  const selector = style.type === "character" ? "r" : "p";
  return `${selector}[style-name='${style.name}'] => ${style.htmlPath}`;
};
