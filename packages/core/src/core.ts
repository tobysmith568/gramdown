export interface ConvertOptions {
  /** Attempt to detect code-block languages. Off by default. */
  guessLang?: boolean;
}

/**
 * Convert the bytes of a Grammarly `.docx` export into GitHub-Flavored Markdown.
 *
 * Pure and I/O-free: no `fs`, no paths, no `process`. Every distribution target
 * (CLI, library, browser) is a thin wrapper around this function.
 */
export async function convert(bytes: Uint8Array, options: ConvertOptions = {}): Promise<string> {
  void bytes;
  void options;
  throw new Error("convert() is not implemented yet");
}
