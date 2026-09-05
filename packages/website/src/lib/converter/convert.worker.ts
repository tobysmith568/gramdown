// organize-imports-ignore -- `./dom-shim` must be evaluated before `@gramdown/core`
/// <reference lib="webworker" />

// The dedicated Web Worker that runs `@gramdown/core`'s `convert()` off the main
// thread. `mammoth` is old CJS that pokes at globals and a large document can
// take a noticeable moment to parse — both reasons to keep it out of the UI
// thread. Vite bundles `@gramdown/core` (and mammoth's browser build, picked up
// via mammoth's own `package.json#browser` field) into this worker chunk.

import "./dom-shim"; // installs window.DOMParser for turndown — keep first
import { convert } from "@gramdown/core";
import type { ConvertRequest, ConvertResponse } from "./messages";

const worker = self as unknown as DedicatedWorkerGlobalScope;

worker.addEventListener("message", (event: MessageEvent<ConvertRequest>) => {
  const request = event.data;
  void handleRequest(request);
});

async function handleRequest(request: ConvertRequest): Promise<void> {
  const warnings: string[] = [];

  try {
    const markdown = await convert(request.bytes, {
      onWarning: warning => warnings.push(warning)
    });

    const response: ConvertResponse = {
      id: request.id,
      ok: true,
      markdown,
      error: null,
      warnings
    };
    worker.postMessage(response);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    const response: ConvertResponse = {
      id: request.id,
      ok: false,
      markdown: null,
      error: message,
      warnings
    };
    worker.postMessage(response);
  }
}
