/**
 * The conversion queue: the single source of truth for what the drop overlay
 * and the tray both show. Plain module state (Preact signals) so the two
 * islands share it without a common component root.
 *
 * Milestone 8.3 keeps this in memory only — persistence across navigation
 * (IndexedDB) is 8.4, and language guessing is 8.5.
 */

import { signal } from "@preact/signals";
import { downloadBytes, downloadMarkdown } from "./download";
import { dedupeName, toMarkdownName } from "./filenames";
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
}

export const conversions = signal<Conversion[]>([]);

/** A transient note when a drop / pick included files that were not `.docx`. */
export const lastRejection = signal<string | null>(null);

let clientPromise: Promise<ConversionClient> | null = null;

/** Add every `.docx` in `files` to the queue and start converting each one. */
export const enqueueFiles = async (files: readonly File[]): Promise<void> => {
  const docxFiles = files.filter(file => file.name.toLowerCase().endsWith(".docx"));
  const rejectedCount = files.length - docxFiles.length;
  lastRejection.value = describeRejection(rejectedCount);

  for (const file of docxFiles) {
    const takenNames = conversions.value.map(entry => entry.outputName);
    const markdownName = toMarkdownName(file.name);
    const outputName = dedupeName(markdownName, takenNames);

    const entry: Conversion = {
      id: crypto.randomUUID(),
      sourceName: file.name,
      outputName,
      sizeBytes: file.size,
      status: "converting",
      markdown: null,
      warnings: [],
      error: null
    };
    conversions.value = [...conversions.value, entry];

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    void runConversion(entry.id, bytes);
  }
};

export const removeConversion = (id: string): void => {
  conversions.value = conversions.value.filter(entry => entry.id !== id);
};

export const clearConversions = (): void => {
  conversions.value = [];
  lastRejection.value = null;
};

export const downloadConversion = (id: string): void => {
  const entry = conversions.value.find(candidate => candidate.id === id);
  if (!entry || entry.markdown === null) {
    return;
  }
  downloadMarkdown(entry.outputName, entry.markdown);
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

const runConversion = async (id: string, bytes: Uint8Array): Promise<void> => {
  try {
    const client = await getClient();
    const result = await client.convert(bytes);
    patchConversion(id, {
      status: "ready",
      markdown: result.markdown,
      warnings: result.warnings
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    patchConversion(id, { status: "error", error: message });
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
