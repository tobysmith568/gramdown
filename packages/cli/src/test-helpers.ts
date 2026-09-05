import type { Io } from "./io";

export interface FakeIo extends Io {
  readonly out: () => string;
  readonly err: () => string;
  readonly written: Map<string, string>;
}

/**
 * An `Io` that records stdout/stderr and captures writes in memory. `files`
 * seeds `readFile`; an unlisted path throws an `ENOENT`-shaped error.
 */
export const fakeIo = (files: Record<string, Uint8Array> = {}): FakeIo => {
  const out: string[] = [];
  const err: string[] = [];
  const written = new Map<string, string>();

  return {
    stdout: text => out.push(text),
    stderr: text => err.push(text),
    readFile: path => {
      const bytes = files[path];
      if (bytes === undefined) {
        const error = new Error(`ENOENT: no such file, open '${path}'`) as Error & { code: string };
        error.code = "ENOENT";
        return Promise.reject(error);
      }
      return Promise.resolve(bytes);
    },
    writeFile: (path, data) => {
      written.set(path, data);
      return Promise.resolve();
    },
    out: () => out.join(""),
    err: () => err.join(""),
    written
  };
};
