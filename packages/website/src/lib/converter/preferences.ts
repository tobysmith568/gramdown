/**
 * Small, per-device UI preferences for the converter. `localStorage` (not
 * IndexedDB) - a single scalar read synchronously at island mount, and losing
 * it is inconsequential.
 */

import { signal } from "@preact/signals";
import { coerceFlag } from "../flags";

// `initialGuessLanguages` below reads storage at module load, so `readFlag` and
// the key it uses have to be declared first.
const guessLanguagesKey = "gramdown:guess-lang";

const readFlag = (key: string, fallback: boolean): boolean => {
  try {
    const stored = globalThis.localStorage?.getItem(key);
    return coerceFlag(stored, fallback);
  } catch {
    return fallback;
  }
};

// On by default here (unlike the CLI): for a casual drag-and-drop user a labelled
// fence beats a bare one, and the guesses are easy to correct.
const initialGuessLanguages = readFlag(guessLanguagesKey, true);

/**
 * Run each code block through `@gramdown/core/guess-lang` and label the fence
 * with the guess. On by default here (unlike the CLI); `store.updateGuessLanguages`
 * re-runs the affected conversions when this flips.
 */
export const guessLanguages = signal<boolean>(initialGuessLanguages);

export const setGuessLanguages = (enabled: boolean): void => {
  guessLanguages.value = enabled;
  writeFlag(guessLanguagesKey, enabled);
};

const writeFlag = (key: string, value: boolean): void => {
  try {
    globalThis.localStorage?.setItem(key, value ? "true" : "false");
  } catch {
    // Private-browsing quota or a storage-blocking extension - the toggle still
    // works for this page, it just won't be remembered.
  }
};
