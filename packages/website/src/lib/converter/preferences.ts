/**
 * Small, per-device UI preferences for the converter. `localStorage` (not
 * IndexedDB) — they're single scalars read synchronously at island mount, and
 * losing one is inconsequential.
 */

import { signal } from "@preact/signals";

// Declared above `autoDownload` because it's read during this module's eager
// evaluation (`const` bindings aren't hoisted).
const autoDownloadKey = "gramdown:auto-download";

const readFlag = (key: string): boolean => {
  try {
    return globalThis.localStorage?.getItem(key) === "true";
  } catch {
    return false;
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
export const autoDownload = signal<boolean>(readFlag(autoDownloadKey));

export const setAutoDownload = (enabled: boolean): void => {
  autoDownload.value = enabled;
  writeFlag(autoDownloadKey, enabled);
};
