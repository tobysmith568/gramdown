/**
 * Turning a block of Markdown into the "dimmed punctuation" view the index-page
 * converter panel renders: one HTML string per source line, with the Markdown
 * syntax (`#`, `**`, fences, link brackets) wrapped in a `.mk` span so the eye
 * lands on the prose rather than the markup.
 *
 * Pure string work, split out of `ConverterPanel` so it can be tested directly -
 * the component just maps the result onto `<div>` rows.
 */

/** HTML-escape the three characters that matter inside a text node. */
export const escapeHtml = (raw: string): string =>
  raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * One HTML string per source line of `markdown`, with the Markdown punctuation
 * wrapped in `<span class="mk">`. Lines inside a fenced code block are passed
 * through escaped-but-undimmed; an empty line becomes `&nbsp;` so the row keeps
 * its height.
 */
export const dimMarkdown = (markdown: string): string[] => {
  const rows = markdown.replace(/\n$/, "").split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const raw of rows) {
    const escaped = escapeHtml(raw);
    if (/^\s*```/.test(raw)) {
      out.push(`<span class="mk">${escaped}</span>` || "&nbsp;");
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(escaped || "&nbsp;");
      continue;
    }
    out.push(dimInline(escaped) || "&nbsp;");
  }

  return out;
};

/** The number of text lines in `markdown`, ignoring a single trailing newline. */
export const countLines = (markdown: string): number =>
  markdown.replace(/\n$/, "").split("\n").length;

/** Wrap the inline Markdown markers in an already-escaped line with `.mk` spans. */
const dimInline = (escaped: string): string => {
  let text = escaped;
  text = text.replace(/^(\s*)(#{1,6} )/, '$1<span class="mk">$2</span>');
  text = text.replace(/^(\s*)([-*] )/, '$1<span class="mk">$2</span>');
  text = text.replace(/^(\s*)(\d+\. )/, '$1<span class="mk">$2</span>');
  text = text.replace(/^(\s*)(&gt; ?)/, '$1<span class="mk">$2</span>');
  text = text.replace(/\*\*/g, '<span class="mk">**</span>');
  text = text.replace(/`([^`]+)`/g, '<span class="mk">`</span>$1<span class="mk">`</span>');
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="mk">[</span>$1<span class="mk">](</span>$2<span class="mk">)</span>'
  );
  return text;
};
