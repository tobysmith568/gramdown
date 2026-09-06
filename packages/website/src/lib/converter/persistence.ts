/**
 * Keeps the conversion queue alive across the MPA: every navigation is a full
 * page load, so the in-memory signal in `store.ts` is gone each time. IndexedDB
 * (via `idb-keyval`) is the source of truth; `store.ts` rehydrates from it on
 * mount and writes back on every mutation.
 *
 * Everything here fails soft - private-browsing modes, a full disk, or a
 * storage-blocking extension must degrade to "the queue just doesn't persist",
 * never to a thrown error the UI has to handle.
 */

import { clear, createStore, get, set } from "idb-keyval";
import type { Conversion } from "./store";

/** The persisted shape is the in-memory one verbatim - every field structured-clones. */
export type ConversionRecord = Conversion;

/** Keep at most this many records, newest first. */
export const maxRecords = 25;

/** …or this many bytes of retained source + Markdown, whichever bites first. */
export const maxRetainedBytes = 25 * 1024 * 1024;

// One IndexedDB database (`gramdown-conversions`), one object store, one key -
// the whole queue is a single value. `createStore` runs eagerly, so it lives up
// here rather than down with the helpers that read it.
const conversionStore = createStore("gramdown-conversions", "conversions");
const storeKey = "queue";

/** Read the saved queue, oldest-first. Returns `[]` when there's nothing (or on any error). */
export const loadConversions = async (): Promise<Conversion[]> => {
  if (!storageAvailable()) {
    return [];
  }
  try {
    const stored = await get<ConversionRecord[]>(storeKey, conversionStore);
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored;
  } catch (cause) {
    warn("failed to read the saved conversions", cause);
    return [];
  }
};

/** Persist the queue, applying the retention cap first. Silently no-ops on error. */
export const saveConversions = async (conversions: readonly Conversion[]): Promise<void> => {
  if (!storageAvailable()) {
    return;
  }
  const capped = applyRetention(conversions);
  try {
    await set(storeKey, capped, conversionStore);
  } catch (cause) {
    warn("failed to save the conversions", cause);
  }
};

/** Wipe the store entirely - backs the tray's "Clear all". */
export const clearStore = async (): Promise<void> => {
  if (!storageAvailable()) {
    return;
  }
  try {
    await clear(conversionStore);
  } catch (cause) {
    warn("failed to clear the saved conversions", cause);
  }
};

/**
 * Trim to the retention budget, evicting the oldest finished records first.
 * In-flight (`converting`) records are always kept regardless of the cap - they
 * still count toward the byte total, but they're never the ones dropped.
 */
export const applyRetention = (conversions: readonly Conversion[]): Conversion[] => {
  const ordered = [...conversions].sort((a, b) => a.createdAt - b.createdAt);

  const pinned = ordered.filter(entry => entry.status === "converting");
  const evictable = ordered.filter(entry => entry.status !== "converting");

  let totalBytes = ordered.reduce((sum, entry) => sum + weigh(entry), 0);
  let count = ordered.length;

  const kept: Conversion[] = [];
  for (const entry of evictable) {
    if (count <= maxRecords && totalBytes <= maxRetainedBytes) {
      kept.push(entry);
      continue;
    }
    totalBytes -= weigh(entry);
    count -= 1;
  }

  const survivors = [...pinned, ...kept];
  return survivors.sort((a, b) => a.createdAt - b.createdAt);
};

const storageAvailable = (): boolean => {
  return typeof indexedDB !== "undefined";
};

const weigh = (entry: Conversion): number => {
  const sourceBytes = entry.sourceBytes?.byteLength ?? 0;
  const markdownBytes = entry.markdown?.length ?? 0;
  return sourceBytes + markdownBytes;
};

const warn = (message: string, cause: unknown): void => {
  console.warn(`[gramdown] ${message}:`, cause);
};
