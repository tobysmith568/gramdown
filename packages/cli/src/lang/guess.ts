import type { LanguageGuesser } from "@gramdown/core";
import flourite from "flourite";

/**
 * A best-effort language guesser for `--guess-lang`, backed by `flourite`'s
 * heuristic scorer.
 *
 * `flourite` counts language-specific token patterns rather than parsing, so it
 * is dependable on JSON/YAML/SQL/shell and shaky on JS-vs-TS — its output always
 * wants a human pass. `{ shiki: true }` returns lowercase fence identifiers
 * (`typescript`, not `Typescript`); `{ noUnknown: true }` returns `""` rather
 * than `"unknown"` when nothing scores, which we map back to "no label".
 */
export const languageGuesser: LanguageGuesser = code => {
  const snippet = code.trim();
  if (snippet.length === 0) {
    return undefined;
  }

  const detected = flourite(snippet, { shiki: true, noUnknown: true });
  const language = detected.language.trim();
  return language.length === 0 ? undefined : language;
};
