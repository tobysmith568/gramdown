import { InvalidDocxError, convert } from "@tobysmith568/grammarly-md-core";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

export interface Io {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}

export const defaultIo: Io = {
  stdout: s => process.stdout.write(s),
  stderr: s => process.stderr.write(s)
};

export function usage(): string {
  return `grammarly-md <input.docx> [options]

  -o, --output <file>    write to file instead of stdout
  -h, --help             show this help
`;
}

const isNotFound = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

export async function run(argv: string[], io: Io = defaultIo): Promise<number> {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    io.stdout(usage());
    return args.length === 0 ? 1 : 0;
  }

  const input = args.find(a => !a.startsWith("-"));
  if (input === undefined) {
    io.stderr("error: no input .docx given\n");
    return 1;
  }
  if (!input.toLowerCase().endsWith(".docx")) {
    io.stderr(`error: not a .docx file: ${input}\n`);
    return 1;
  }

  const outIndex = Math.max(args.indexOf("-o"), args.indexOf("--output"));
  const output = outIndex === -1 ? undefined : args[outIndex + 1];

  let markdown: string;
  try {
    const bytes = new Uint8Array(await readFile(input));
    markdown = await convert(bytes, { onWarning: warning => io.stderr(`warning: ${warning}\n`) });
  } catch (error) {
    if (error instanceof InvalidDocxError) {
      io.stderr(`error: ${input}: ${error.message}\n`);
      return 1;
    }
    if (isNotFound(error)) {
      io.stderr(`error: no such file: ${input}\n`);
      return 1;
    }
    throw error;
  }

  if (output) {
    await writeFile(output, markdown);
  } else {
    io.stdout(markdown);
  }
  return 0;
}
