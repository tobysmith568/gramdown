/**
 * Reading a worker reply and turning it into a value or a thrown `Error`. Split
 * out of `worker-client.ts` so the "wrong message kind" / "failed with no error
 * string" branches can be tested without spinning up a worker.
 */

import type { WorkerResponse } from "./messages";

export interface ConversionResult {
  markdown: string;
  warnings: string[];
}

/** The Markdown + warnings from a `convert` reply; throws on a mismatch or a failure. */
export const readConvertResult = (response: WorkerResponse): ConversionResult => {
  if (response.kind !== "convert") {
    throw new Error("the worker answered a convert request with the wrong message kind");
  }
  if (response.ok && response.markdown !== null) {
    return { markdown: response.markdown, warnings: response.warnings };
  }
  throw new Error(response.error ?? "the conversion worker failed for an unknown reason");
};

/** The archive bytes from a `zip` reply; throws on a mismatch or a failure. */
export const readZipBytes = (response: WorkerResponse): Uint8Array => {
  if (response.kind !== "zip") {
    throw new Error("the worker answered a zip request with the wrong message kind");
  }
  if (response.ok && response.bytes !== null) {
    return response.bytes;
  }
  throw new Error(response.error ?? "the zip worker failed for an unknown reason");
};
