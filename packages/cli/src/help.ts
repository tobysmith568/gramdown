import packageJson from "../package.json";

/** The `--help` / no-args text. */
export const usageText = (): string => `gramdown <input.docx> [options]

Convert a Grammarly .docx export to Markdown, written to stdout by default.

  -o, --output <file>   write Markdown to <file> instead of stdout
      --guess-lang      label code fences with a guessed language (default: off)
  -h, --help            show this help
  -v, --version         print the version

Grammarly records no language on its code blocks, so --guess-lang is a
heuristic guess that always needs a human pass.
`;

/** The `--version` text: the bare version, no prefix. */
export const versionText = (): string => packageJson.version;
