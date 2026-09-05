// Shared fragment-builders for the preprocess/*.test.ts files: minimal but
// well-formed `<w:p>`/`<w:r>` XML, just enough for each module's own regexes
// to work on.

export const run = (text: string, monospace = false): string =>
  `<w:r><w:rPr>${monospace ? mono : ""}</w:rPr><w:t>${text}</w:t></w:r>`;

export const paragraph = (...children: string[]): string =>
  `<w:p><w:pPr><w:jc w:val="left" /></w:pPr>${children.join("")}</w:p>`;

export const body = (...paragraphs: string[]): string => `<w:body>${paragraphs.join("")}</w:body>`;

/**
 * A `<w:p>` holding a single run of `text` — the common case, so tests don't
 * have to nest `paragraph(run(...))`.
 */
export const line = (text: string, monospace = false): string => {
  const onlyRun = run(text, monospace);
  return paragraph(onlyRun);
};

/** A code-styled paragraph carrying real Grammarly-style before/after spacing. */
export const codeParagraph = (text: string, before: number, after: number): string => {
  const codeRun = run(text, true);
  return `<w:p><w:pPr><w:spacing w:before="${before}" w:after="${after}" /></w:pPr>${codeRun}</w:p>`;
};

const mono = '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" />';
