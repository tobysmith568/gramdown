import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

/**
 * Everything the CLI needs from the outside world, behind one interface so the
 * command handlers can be tested without touching the real filesystem or the
 * real streams. `bin.ts` is the only place the concrete `defaultIo` is wired in.
 */
export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  readFile: (path: string) => Promise<Uint8Array>;
  writeFile: (path: string, data: string) => Promise<void>;
}

export const defaultIo: Io = {
  stdout: text => process.stdout.write(text),
  stderr: text => process.stderr.write(text),
  readFile: async path => {
    const buffer = await readFile(path);
    return new Uint8Array(buffer);
  },
  writeFile: (path, data) => writeFile(path, data)
};

/** True for the `ENOENT` a missing input file produces. */
export const isFileNotFoundError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
