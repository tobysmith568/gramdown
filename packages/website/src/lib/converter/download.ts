/**
 * Hand the visitor a file to save. Everything the converter produces stays in
 * the browser - this is the only way it leaves, and only when they ask.
 */

/** Save a Markdown string as `filename` (`text/markdown`). */
export const downloadMarkdown = (filename: string, markdown: string): void => {
  const blob = new Blob([markdown], { type: "text/markdown" });
  saveBlob(filename, blob);
};

/** Save raw bytes as `filename` with the given MIME type (used for the `.zip`). */
export const downloadBytes = (filename: string, bytes: Uint8Array, mimeType: string): void => {
  // Current TS libs type `Uint8Array` as `Uint8Array<ArrayBufferLike>`, which
  // isn't assignable to `BlobPart` (that excludes `SharedArrayBuffer` views).
  // The worker's zip output is always a plain, offset-0 array - safe to treat
  // as a `BlobPart`.
  const part = bytes as unknown as BlobPart;
  const blob = new Blob([part], { type: mimeType });
  saveBlob(filename, blob);
};

const saveBlob = (filename: string, blob: Blob): void => {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoke on the next tick - revoking synchronously can cancel the download in
  // some browsers before it has started reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
