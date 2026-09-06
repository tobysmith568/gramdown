/**
 * Small, per-device UI preferences for the converter. `localStorage` (not
 * IndexedDB) — they're single scalars read synchronously at island mount, and
 * losing one is inconsequential.
 */

import { signal } from "@preact/signals";

// `readFlag` and the two keys are all read during this module's eager evaluation
// (the `initial*` consts below), so they sit above the exports — `const` bindings
// aren't hoisted. `writeFlag` is only touched inside the setters, so it lives at
// the bottom with the other private helpers.
const autoDownloadKey = "gramdown:auto-download";
const guessLanguagesKey = "gramdown:guess-lang";

const readFlag = (key: string, fallback: boolean): boolean => {
  try {
    const stored = globalThis.localStorage?.getItem(key);
    if (stored === "true") {
      return true;
    }
    if (stored === "false") {
      return false;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

// Off by default: a page you just landed on shouldn't drop files in `~/Downloads`.
const initialAutoDownload = readFlag(autoDownloadKey, false);

// On by default here (unlike the CLI): for a casual drag-and-drop user a labelled
// fence beats a bare one, and the guesses are easy to correct.
const initialGuessLanguages = readFlag(guessLanguagesKey, true);

/**
 * Download each file to disk the moment it's ready, without a click. Off by
 * default: a page you just landed on shouldn't drop files in `~/Downloads`, and
 * several at once means several browser permission prompts.
 */
export const autoDownload = signal<boolean>(initialAutoDownload);

/**
 * Run each code block through `@gramdown/core/guess-lang` and label the fence
 * with the guess. On by default here (unlike the CLI); `store.updateGuessLanguages`
 * re-runs the affected conversions when this flips.
 */
export const guessLanguages = signal<boolean>(initialGuessLanguages);

export const setAutoDownload = (enabled: boolean): void => {
  autoDownload.value = enabled;
  writeFlag(autoDownloadKey, enabled);
};

export const setGuessLanguages = (enabled: boolean): void => {
  guessLanguages.value = enabled;
  writeFlag(guessLanguagesKey, enabled);
};

const writeFlag = (key: string, value: boolean): void => {
  try {
    globalThis.localStorage?.setItem(key, value ? "true" : "false");
  } catch {
    // Private-browsing quota or a storage-blocking extension — the toggle still
    // works for this page, it just won't be remembered.
  }
};
