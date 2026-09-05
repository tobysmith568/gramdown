import flourite from "flourite";
import type { LanguageGuesser } from "./html-to-markdown";

/**
 * A best-effort {@link LanguageGuesser} for `convert`'s `guessLanguage` option,
 * backed by `flourite`'s heuristic scorer. This is the same guesser the
 * `gramdown` CLI wires up for `--guess-lang`, exported here so a library caller
 * gets the same fence labels without reconstructing the setup.
 *
 * If you want a heavier, potentially more accurate guess, write your own
 * {@link LanguageGuesser} around an ML detector (`@vscode/vscode-languagedetection`,
 * `guesslang-js`, for example) and pass that instead.
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
