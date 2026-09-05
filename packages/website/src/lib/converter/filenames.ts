/**
 * Turning a dropped `.docx` filename into the `.md` name we offer for download,
 * and keeping those names unique when someone converts several files whose names
 * collide (`report.docx` twice, or `report.docx` and a stray `report.md`).
 */

/** `path/to/My Post.docx` -> `My Post.md`. Falls back to `document.md`. */
export const toMarkdownName = (docxName: string): string => {
  const segments = docxName.split(/[\\/]/);
  const basename = segments[segments.length - 1] ?? docxName;
  const stem = basename.replace(/\.docx$/i, "").trim();
  const safeStem = stem.length === 0 ? "document" : stem;
  return `${safeStem}.md`;
};

/**
 * Return `name` if it is not already in `taken`, otherwise the first
 * `name-2` / `name-3` / … variant that is free.
 */
export const dedupeName = (name: string, taken: readonly string[]): string => {
  if (!taken.includes(name)) {
    return name;
  }

  const dot = name.lastIndexOf(".");
  const stem = dot === -1 ? name : name.slice(0, dot);
  const extension = dot === -1 ? "" : name.slice(dot);

  let suffix = 2;
  let candidate = `${stem}-${suffix}${extension}`;
  while (taken.includes(candidate)) {
    suffix++;
    candidate = `${stem}-${suffix}${extension}`;
  }
  return candidate;
};
