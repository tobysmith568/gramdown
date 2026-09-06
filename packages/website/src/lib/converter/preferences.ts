/**
 * Small, per-device UI preferences for the converter. `localStorage` (not
 * IndexedDB) — they're single scalars read synchronously at island mount, and
 * losing one is inconsequential.
 */

import { signal } from "@preact/signals";

// Declared above the signals below because they're read during this module's
// eager evaluation (`const` bindings aren't hoisted).
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

const writeFlag = (key: string, value: boolean): void => {
  try {
    globalThis.localStorage?.setItem(key, value ? "true" : "false");
  } catch {
    // Private-browsing quota or a storage-blocking extension — the toggle still
    // works for this page, it just won't be remembered.
  }
};

/**
 * Download each file to disk the moment it's ready, without a click. Off by
 * default: a page you just landed on shouldn't drop files in `~/Downloads`, and
 * several at once means several browser permission prompts.
 */
export const autoDownload = signal<boolean>(readFlag(autoDownloadKey, false));

/**
 * Run each code block through `@gramdown/core/guess-lang` and label the fence
 * with the guess. On by default here (unlike the CLI): a labelled fence beats a
 * bare one for a casual drag-and-drop user, and the guesses are easy to correct.
 * `store.updateGuessLanguages` re-runs the affected conversions when this flips.
 */
export const guessLanguages = signal<boolean>(readFlag(guessLanguagesKey, true));

export const setAutoDownload = (enabled: boolean): void => {
  autoDownload.value = enabled;
  writeFlag(autoDownloadKey, enabled);
};

export const setGuessLanguages = (enabled: boolean): void => {
  guessLanguages.value = enabled;
  writeFlag(guessLanguagesKey, enabled);
};
