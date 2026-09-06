import ConvertWorker from "./convert.worker.ts?worker";
import type { ConvertRequest, ConvertZipRequest, WorkerResponse, ZipEntry } from "./messages";

export interface ConversionResult {
  markdown: string;
  warnings: string[];
}

/**
 * A typed wrapper around the conversion Web Worker. One instance owns one
 * worker and multiplexes concurrent requests - `convert()` and `zip()` alike -
 * over it by request id.
 *
 * This is also the seam where a later `SharedWorker` progressive enhancement
 * would branch (see the milestone doc) - nothing downstream touches the worker
 * directly.
 */
export class ConversionClient {
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingRequest>();
  private nextId = 0;

  constructor() {
    this.worker = new ConvertWorker();
    this.worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      this.handleResponse(event.data);
    });
  }

  convert(bytes: Uint8Array, guessLanguage: boolean): Promise<ConversionResult> {
    const id = this.nextId++;
    const request: ConvertRequest = { kind: "convert", id, bytes, guessLanguage };

    const result = new Promise<ConversionResult>((resolve, reject) => {
      const settle = (response: WorkerResponse): void => {
        if (response.kind !== "convert") {
          reject(new Error("the worker answered a convert request with the wrong message kind"));
          return;
        }
        if (response.ok && response.markdown !== null) {
          resolve({ markdown: response.markdown, warnings: response.warnings });
          return;
        }
        const message = response.error ?? "the conversion worker failed for an unknown reason";
        reject(new Error(message));
      };
      this.pending.set(id, { settle, abort: reject });
    });

    this.worker.postMessage(request);
    return result;
  }

  zip(entries: ZipEntry[]): Promise<Uint8Array> {
    const id = this.nextId++;
    const request: ConvertZipRequest = { kind: "zip", id, entries };

    const result = new Promise<Uint8Array>((resolve, reject) => {
      const settle = (response: WorkerResponse): void => {
        if (response.kind !== "zip") {
          reject(new Error("the worker answered a zip request with the wrong message kind"));
          return;
        }
        if (response.ok && response.bytes !== null) {
          resolve(response.bytes);
          return;
        }
        const message = response.error ?? "the zip worker failed for an unknown reason";
        reject(new Error(message));
      };
      this.pending.set(id, { settle, abort: reject });
    });

    this.worker.postMessage(request);
    return result;
  }

  terminate(): void {
    this.worker.terminate();
    for (const request of this.pending.values()) {
      request.abort(new Error("the conversion worker was terminated"));
    }
    this.pending.clear();
  }

  private handleResponse(response: WorkerResponse): void {
    const waiting = this.pending.get(response.id);
    if (!waiting) {
      return;
    }
    this.pending.delete(response.id);
    waiting.settle(response);
  }
}

interface PendingRequest {
  /** Hand the matching worker response to the waiting promise. */
  settle: (response: WorkerResponse) => void;
  /** Fail the waiting promise (used when the worker is terminated mid-flight). */
  abort: (error: Error) => void;
}
