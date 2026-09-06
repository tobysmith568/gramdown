/**
 * The conversion queue: the single source of truth shared by the index-page
 * editor panel, the site-wide drag overlay and the bottom-right counter. Plain
 * module state (Preact signals) so the islands share it without a common
 * component root.
 *
 * `initPersistence` (called once from the `Converter` island) rehydrates the
 * queue from IndexedDB, keeps it written back on every mutation, and syncs it
 * across tabs. `updateGuessLanguages` re-runs affected files when the
 * "guess code languages" preference flips.
 */

import { effect, signal } from "@preact/signals";
import { downloadBytes, downloadMarkdown } from "./download";
import { dedupeName, toMarkdownName } from "./filenames";
import { applyRetention, clearStore, loadConversions, saveConversions } from "./persistence";
import { guessLanguages, setGuessLanguages } from "./preferences";
import type { ConversionClient } from "./worker-client";

export type ConversionStatus = "converting" | "ready" | "error";

export interface Conversion {
  id: string;
  /** The dropped `.docx` filename, shown to the user. */
  sourceName: string;
  /** The de-duplicated `.md` filename offered for download. */
  outputName: string;
  sizeBytes: number;
  status: ConversionStatus;
  markdown: string | null;
  warnings: string[];
  error: string | null;
  /** Retained so a re-run works after a reload and the record is self-contained. */
  sourceBytes: Uint8Array;
  /** Whether the Markdown was produced with code-language guessing on. */
  langGuessed: boolean;
  /** Epoch millis; drives oldest-first retention eviction. */
  createdAt: number;
}

export const conversions = signal<Conversion[]>([]);

/** A transient note when a drop / pick included files that were not `.docx`. */
export const lastRejection = signal<string | null>(null);

/**
 * Flips `true` once `initPersistence` has read the saved queue (or determined
 * there is none). The index panel waits for this before it renders, so a
 * persisted queue doesn't flash in a beat after the sample.
 */
export const hydrated = signal<boolean>(false);

const broadcastChannelName = "gramdown-conversions";
const persistDebounceMs = 150;

let clientPromise: Promise<ConversionClient> | null = null;
let channel: BroadcastChannel | null = null;
let persistTimer: ReturnType<typeof setTimeout> | undefined;
/** The exact array last written to storage — reference-compared to skip no-op saves. */
let lastPersisted: Conversion[] | null = null;

/**
 * Wire the in-memory queue to IndexedDB. Call once, client-side, on island
 * mount; the returned function tears the wiring down again.
 */
export const initPersistence = async (): Promise<() => void> => {
  const stored = await loadConversions();
  lastPersisted = stored;
  conversions.value = stored;
  hydrated.value = true;

  // Anything caught mid-conversion by a navigation or reload restarts from its
  // retained source bytes.
  for (const entry of conversions.value) {
    if (entry.status === "converting") {
      void runConversion(entry.id, entry.sourceBytes, entry.langGuessed);
    }
  }

  const disposeEffect = effect(() => {
    // Subscribe to the queue and persist a debounced snapshot on every change.
    void conversions.value;
    schedulePersist();
  });

  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(broadcastChannelName);
    channel.addEventListener("message", onPeerMutation);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    disposeEffect();
    channel?.removeEventListener("message", onPeerMutation);
    channel?.close();
    channel = null;
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
};

/** Add every `.docx` in `files` to the queue and start converting each one. */
export const enqueueFiles = async (files: readonly File[]): Promise<void> => {
  const docxFiles = files.filter(file => file.name.toLowerCase().endsWith(".docx"));
  const rejectedCount = files.length - docxFiles.length;
  lastRejection.value = describeRejection(rejectedCount);

  const guessLanguage = guessLanguages.value;

  for (const file of docxFiles) {
    const takenNames = conversions.value.map(entry => entry.outputName);
    const markdownName = toMarkdownName(file.name);
    const outputName = dedupeName(markdownName, takenNames);

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const entry: Conversion = {
      id: crypto.randomUUID(),
      sourceName: file.name,
      outputName,
      sizeBytes: file.size,
      status: "converting",
      markdown: null,
      warnings: [],
      error: null,
      sourceBytes: bytes,
      langGuessed: guessLanguage,
      createdAt: Date.now()
    };
    const withEntry = [...conversions.value, entry];
    conversions.value = applyRetention(withEntry);

    void runConversion(entry.id, bytes, guessLanguage);
  }
};

/**
 * Persist the "guess code languages" preference and re-run every finished
 * conversion whose Markdown was produced the other way, from its retained
 * source bytes — no re-drop needed.
 *
 * The re-run leaves the row's `status` on `ready` and swaps the Markdown in
 * place when it lands, so the editor shows a quiet live update rather than
 * flickering through a "converting" state.
 */
export const updateGuessLanguages = (enabled: boolean): void => {
  setGuessLanguages(enabled);

  for (const entry of conversions.value) {
    if (entry.status === "ready" && entry.langGuessed !== enabled) {
      void reguessLanguages(entry.id, entry.sourceBytes, enabled);
    }
  }
};

export const removeConversion = (id: string): void => {
  conversions.value = conversions.value.filter(entry => entry.id !== id);
};

export const clearConversions = (): void => {
  const empty: Conversion[] = [];
  lastPersisted = empty;
  conversions.value = empty;
  lastRejection.value = null;
  void clearStore();
  channel?.postMessage("mutated");
};

export const downloadConversion = (id: string): void => {
  const entry = conversions.value.find(candidate => candidate.id === id);
  if (!entry || entry.markdown === null) {
    return;
  }
  downloadMarkdown(entry.outputName, entry.markdown);
};

/**
 * Write the current queue to storage now, skipping the debounce. Call before a
 * deliberate navigation (e.g. a drop on a non-index page that routes to the
 * converter) so the just-enqueued file survives the page load.
 */
export const flushQueue = async (): Promise<void> => {
  clearTimeout(persistTimer);
  await persist();
};

/** Zip every finished file (in the worker) and hand the archive to the browser. */
export const downloadAllAsZip = async (): Promise<void> => {
  const ready = conversions.value.filter(isDownloadable);
  if (ready.length === 0) {
    return;
  }

  const entries = ready.map(entry => ({ name: entry.outputName, markdown: entry.markdown }));
  const client = await getClient();
  const bytes = await client.zip(entries);
  downloadBytes("gramdown-markdown.zip", bytes, "application/zip");
};

const runConversion = async (
  id: string,
  bytes: Uint8Array,
  guessLanguage: boolean
): Promise<void> => {
  try {
    const client = await getClient();
    const result = await client.convert(bytes, guessLanguage);
    patchConversion(id, {
      status: "ready",
      markdown: result.markdown,
      warnings: result.warnings,
      langGuessed: guessLanguage
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    patchConversion(id, { status: "error", error: message });
  }
};

/**
 * Re-convert a finished file with the other language-guessing setting, swapping
 * the Markdown in place without touching `status` — see `updateGuessLanguages`.
 * A failure leaves the previous Markdown untouched.
 */
const reguessLanguages = async (
  id: string,
  bytes: Uint8Array,
  guessLanguage: boolean
): Promise<void> => {
  try {
    const client = await getClient();
    const result = await client.convert(bytes, guessLanguage);
    patchConversion(id, {
      markdown: result.markdown,
      warnings: result.warnings,
      langGuessed: guessLanguage
    });
  } catch (cause) {
    console.warn("[gramdown] could not re-run a conversion for the language toggle:", cause);
  }
};

const getClient = (): Promise<ConversionClient> => {
  // Loaded lazily and only in the browser: importing `./worker-client` pulls in
  // `new URL("./convert.worker.ts", …)`, which must never be evaluated on the
  // server during the static build.
  clientPromise ??= import("./worker-client").then(module => new module.ConversionClient());
  return clientPromise;
};

const patchConversion = (id: string, changes: Partial<Conversion>): void => {
  conversions.value = conversions.value.map(entry =>
    entry.id === id ? { ...entry, ...changes } : entry
  );
};

const schedulePersist = (): void => {
  if (typeof indexedDB === "undefined") {
    return;
  }
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void persist(), persistDebounceMs);
};

const persist = async (): Promise<void> => {
  const snapshot = conversions.value;
  if (snapshot === lastPersisted) {
    return;
  }
  lastPersisted = snapshot;
  await saveConversions(snapshot);
  channel?.postMessage("mutated");
};

const reloadFromStore = async (): Promise<void> => {
  const stored = await loadConversions();
  lastPersisted = stored;
  conversions.value = stored;
};

const onPeerMutation = (): void => {
  void reloadFromStore();
};

const onVisibilityChange = (): void => {
  if (document.visibilityState === "visible") {
    void reloadFromStore();
  }
};

const isDownloadable = (entry: Conversion): entry is Conversion & { markdown: string } => {
  return entry.status === "ready" && entry.markdown !== null;
};

const describeRejection = (count: number): string | null => {
  if (count === 0) {
    return null;
  }
  if (count === 1) {
    return "Skipped 1 file that isn’t a .docx.";
  }
  return `Skipped ${count} files that aren’t .docx.`;
};
