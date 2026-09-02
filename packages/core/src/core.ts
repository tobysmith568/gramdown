import { docxToHtml } from "./docx-to-html.js";
import { htmlToMarkdown, type LanguageGuesser } from "./html-to-markdown.js";
import { postprocess } from "./postprocess.js";
import { preprocessDocx } from "./preprocess.js";

export interface ConvertOptions {
  /**
   * Called with the contents of each code block to produce a fence info string.
   *
   * Grammarly records no language anywhere in the `.docx`, so there is nothing
   * to recover — supply a detector (`highlight.js`, `flourite`, …) if a guess is
   * better than nothing. Unset means unlabelled fences.
   */
  guessLanguage?: LanguageGuesser;

  /** Receives any warnings mammoth raised while reading the document. */
  onWarning?: (warning: string) => void;
}

/** Thrown when the input is not a readable `.docx`. */
export class InvalidDocxError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "InvalidDocxError";
  }
}

/**
 * Convert the bytes of a Grammarly `.docx` export into GitHub-Flavored Markdown.
 *
 * Pure and I/O-free: no `fs`, no paths, no `process`. Every distribution target
 * (CLI, library, browser) is a thin wrapper around this function.
 */
export async function convert(bytes: Uint8Array, options: ConvertOptions = {}): Promise<string> {
  if (bytes.byteLength === 0) throw new InvalidDocxError("the file is empty");

  let restyled: Uint8Array;
  try {
    restyled = await preprocessDocx(bytes);
  } catch (cause) {
    throw new InvalidDocxError("the file could not be read as a .docx archive", { cause });
  }

  let html: string;
  try {
    const result = await docxToHtml(restyled);
    html = result.html;
    result.warnings.forEach(warning => options.onWarning?.(warning));
  } catch (cause) {
    throw new InvalidDocxError("the file is not a Word document", { cause });
  }

  return postprocess(htmlToMarkdown(html, { guessLanguage: options.guessLanguage }));
}
