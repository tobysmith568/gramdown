/**
 * The postMessage contract between the main thread and `convert.worker.ts`.
 * Kept in its own module so both sides import the types without either pulling
 * in the other's runtime (the worker must not import DOM code, the client must
 * not import `@gramdown/core` or `jszip`).
 *
 * Every message carries a `kind` discriminant and a numeric `id`; the client
 * multiplexes concurrent requests of every kind over one worker by that `id`.
 */

/** Main thread → worker: convert these `.docx` bytes to Markdown. */
export interface ConvertRequest {
  kind: "convert";
  id: number;
  bytes: Uint8Array;
}

/** Main thread → worker: bundle these Markdown files into a single `.zip`. */
export interface ConvertZipRequest {
  kind: "zip";
  id: number;
  entries: ZipEntry[];
}

export interface ZipEntry {
  name: string;
  markdown: string;
}

export type WorkerRequest = ConvertRequest | ConvertZipRequest;

/** Worker → main thread: the conversion result for a given request `id`. */
export interface ConvertResponse {
  kind: "convert";
  id: number;
  ok: boolean;
  markdown: string | null;
  error: string | null;
  warnings: string[];
}

/** Worker → main thread: the zipped archive bytes for a given request `id`. */
export interface ConvertZipResponse {
  kind: "zip";
  id: number;
  ok: boolean;
  bytes: Uint8Array | null;
  error: string | null;
}

export type WorkerResponse = ConvertResponse | ConvertZipResponse;
