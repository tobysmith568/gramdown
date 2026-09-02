#!/usr/bin/env node
import { convert } from "@tobysmith568/grammarly-md-core";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

export interface Io {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}

const defaultIo: Io = {
  stdout: s => process.stdout.write(s),
  stderr: s => process.stderr.write(s)
};

export function usage(): string {
  return `grammarly-md <input.docx> [options]

  -o, --output <file>    write to file instead of stdout
  --guess-lang           attempt to detect code-block languages (default: off)
  -h, --help             show this help
`;
}

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
  const guessLang = args.includes("--guess-lang");

  const bytes = new Uint8Array(await readFile(input));
  const markdown = await convert(bytes, { guessLang });

  if (output) {
    await writeFile(output, markdown);
  } else {
    io.stdout(markdown);
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  run(process.argv)
    .then(code => process.exit(code))
    .catch((err: unknown) => {
      defaultIo.stderr(`error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    });
}
