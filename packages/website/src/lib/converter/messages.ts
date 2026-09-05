/**
 * The postMessage contract between the main thread and `convert.worker.ts`.
 * Kept in its own module so both sides import the types without either pulling
 * in the other's runtime (the worker must not import DOM code, the client must
 * not import `@gramdown/core`).
 */

/** Main thread → worker: convert these `.docx` bytes. */
export interface ConvertRequest {
  id: number;
  bytes: Uint8Array;
}

/** Worker → main thread: the result for a given request `id`. */
export interface ConvertResponse {
  id: number;
  ok: boolean;
  markdown: string | null;
  error: string | null;
  warnings: string[];
}
