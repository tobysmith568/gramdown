import ConvertWorker from "./convert.worker.ts?worker";
import type { ConvertRequest, ConvertResponse } from "./messages";

export interface ConversionResult {
  markdown: string;
  warnings: string[];
}

interface PendingConversion {
  resolve: (result: ConversionResult) => void;
  reject: (error: Error) => void;
}

/**
 * A typed wrapper around the conversion Web Worker. One instance owns one
 * worker and multiplexes concurrent `convert()` calls over it by request id.
 *
 * This is also the seam where a later `SharedWorker` progressive enhancement
 * would branch (see the milestone doc) — nothing downstream touches the worker
 * directly.
 */
export class ConversionClient {
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingConversion>();
  private nextId = 0;

  constructor() {
    this.worker = new ConvertWorker();
    this.worker.addEventListener("message", (event: MessageEvent<ConvertResponse>) => {
      this.handleResponse(event.data);
    });
  }

  convert(bytes: Uint8Array): Promise<ConversionResult> {
    const id = this.nextId++;
    const request: ConvertRequest = { id, bytes };

    const result = new Promise<ConversionResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.worker.postMessage(request);
    return result;
  }

  terminate(): void {
    this.worker.terminate();
    this.pending.clear();
  }

  private handleResponse(response: ConvertResponse): void {
    const waiting = this.pending.get(response.id);
    if (!waiting) {
      return;
    }
    this.pending.delete(response.id);

    if (response.ok && response.markdown !== null) {
      waiting.resolve({ markdown: response.markdown, warnings: response.warnings });
      return;
    }

    const message = response.error ?? "the conversion worker failed for an unknown reason";
    waiting.reject(new Error(message));
  }
}
