import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/** Grammarly indents code with U+00A0, which is not copy-pasteable as code. */
const nbspRe = /\u00a0/g;

const unpadded = (code: string): string => code.replace(nbspRe, " ").replace(/\n+$/, "");

/** A backtick fence long enough not to collide with backticks in the content. */
const fenceFor = (code: string, minimum: number): string => {
  const longest = (code.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
  return "`".repeat(Math.max(minimum, longest + 1));
};

export type LanguageGuesser = (code: string) => string | undefined;

export interface MarkdownOptions {
  /** Called for each code block to produce a fence info string. */
  guessLanguage?: LanguageGuesser;
}

export const createTurndown = (options: MarkdownOptions = {}): TurndownService => {
  const turndown = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined"
  });

  turndown.use(gfm);

  // Turndown discards underline, subscript and superscript, and GFM has no
  // native syntax for any of them. Grammarly writes `<u>` only when it was
  // applied deliberately (see automaticLinkUnderline below), so all three are
  // worth keeping as inline HTML rather than silently losing the formatting.
  turndown.keep(["u", "sub", "sup"]);

  // Mammoth emits code blocks as a bare `<pre>` rather than `<pre><code>`, which
  // turndown's built-in rules do not recognise — they would fall through to the
  // default block handling and collapse the code's whitespace.
  turndown.addRule("codeBlock", {
    filter: node => node.nodeName === "PRE",
    replacement: (_content, node) => {
      const code = unpadded(node.textContent ?? "");
      const language = options.guessLanguage?.(code) ?? "";
      const fence = fenceFor(code, 3);
      return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
    }
  });

  turndown.addRule("inlineCode", {
    filter: node => node.nodeName === "CODE" && node.parentNode?.nodeName !== "PRE",
    replacement: (_content, node) => {
      const code = (node.textContent ?? "").replace(nbspRe, " ");
      if (code === "") {
        return "";
      }

      // A leading or trailing backtick (or space) needs padding to survive.
      const fence = fenceFor(code, 1);
      const pad = /^`|`$/.test(code) ? " " : "";
      return `${fence}${pad}${code}${pad}${fence}`;
    }
  });

  // Turndown pads its list markers out to four columns ("-   item"). One space
  // is the more common convention and what every Markdown formatter will
  // normalise to anyway.
  turndown.addRule("listItem", {
    filter: node => node.nodeName === "LI",
    replacement: (content, node) => {
      const parent = node.parentNode;
      const ordered = parent?.nodeName === "OL";
      const start = Number((parent as HTMLElement | null)?.getAttribute?.("start") ?? 1);
      const index = Array.prototype.indexOf.call(parent?.childNodes ?? [], node);
      const prefix = ordered ? `${start + index}. ` : `${turndown.options.bulletListMarker} `;

      const body = content
        .replace(/^\n+/, "")
        .replace(/\n+$/, "\n")
        .replace(/\n/gm, `\n${" ".repeat(prefix.length)}`);

      const separator = node.nextSibling && !/\n$/.test(body) ? "\n" : "";
      return `${prefix}${body}${separator}`;
    }
  });

  // turndown-plugin-gfm's own strikethrough rule uses a single `~`, which is
  // ambiguous outside GitHub's own renderer. `~~` is the form the GFM spec
  // documents and every other Markdown flavour that supports strikethrough
  // recognises.
  turndown.addRule("strikethrough", {
    filter: node => ["DEL", "S", "STRIKE"].includes(node.nodeName),
    replacement: content => `~~${content}~~`
  });

  // Word underlines hyperlink text automatically, which would otherwise come out
  // as `[<u>text</u>](url)`. Underline that is not the whole of a link's content
  // was applied deliberately, so it is left alone.
  turndown.addRule("automaticLinkUnderline", {
    filter: node =>
      node.nodeName === "U" &&
      node.parentNode?.nodeName === "A" &&
      node.parentNode.childNodes.length === 1,
    replacement: content => content
  });

  return turndown;
};

/** Convert mammoth's HTML into GitHub-Flavored Markdown. */
export const htmlToMarkdown = (html: string, options: MarkdownOptions = {}): string =>
  createTurndown(options).turndown(html);
