// organize-imports-ignore -- `./dom-shim` must be evaluated before `@gramdown/core`
/// <reference lib="webworker" />

// The dedicated Web Worker that runs `@gramdown/core`'s `convert()` off the main
// thread, and (same worker, same bundle) zips a batch of finished Markdown files
// with `jszip`. `mammoth` is old CJS that pokes at globals and a large document
// can take a noticeable moment to parse — both reasons to keep the pipeline out
// of the UI thread. `jszip` is already in this chunk because `@gramdown/core`
// pulls it in for the preprocess pass, so the "download all" path costs no extra
// bytes. Vite bundles all of it (and mammoth's browser build, picked up via
// mammoth's own `package.json#browser` field) into this worker chunk.

import "./dom-shim"; // installs window.DOMParser for turndown — keep first
import { convert } from "@gramdown/core";
import { languageGuesser } from "@gramdown/core/guess-lang";
import JSZip from "jszip";
import type {
  ConvertRequest,
  ConvertResponse,
  ConvertZipRequest,
  ConvertZipResponse,
  WorkerRequest
} from "./messages";

const worker = self as unknown as DedicatedWorkerGlobalScope;

worker.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  switch (request.kind) {
    case "convert":
      void handleConvert(request);
      return;
    case "zip":
      void handleZip(request);
      return;
  }
});

const handleConvert = async (request: ConvertRequest): Promise<void> => {
  const warnings: string[] = [];

  try {
    const guessLanguage = request.guessLanguage ? languageGuesser : undefined;
    const markdown = await convert(request.bytes, {
      guessLanguage,
      onWarning: warning => warnings.push(warning)
    });

    const response: ConvertResponse = {
      kind: "convert",
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
      kind: "convert",
      id: request.id,
      ok: false,
      markdown: null,
      error: message,
      warnings
    };
    worker.postMessage(response);
  }
};

const handleZip = async (request: ConvertZipRequest): Promise<void> => {
  try {
    const zip = new JSZip();
    for (const entry of request.entries) {
      zip.file(entry.name, entry.markdown);
    }

    const bytes = await zip.generateAsync({ type: "uint8array" });

    const response: ConvertZipResponse = {
      kind: "zip",
      id: request.id,
      ok: true,
      bytes,
      error: null
    };
    worker.postMessage(response);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    const response: ConvertZipResponse = {
      kind: "zip",
      id: request.id,
      ok: false,
      bytes: null,
      error: message
    };
    worker.postMessage(response);
  }
};
