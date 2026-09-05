import { parseArgs } from "node:util";
import { UsageError } from "../errors";
import { convertOptionsSchema, type ConvertOptions } from "./schema";

/**
 * What a command line resolves to. `help` and `version` short-circuit before
 * any `.docx` is required; `convert` carries a fully validated option set.
 */
export type CliInvocation =
  | { kind: "help"; explicit: boolean }
  | { kind: "version" }
  | { kind: "convert"; options: ConvertOptions };

/** Turn raw `process.argv` into a validated invocation, or throw `UsageError`. */
export const parseCliArgs = (argv: string[]): CliInvocation => {
  const args = argv.slice(2);
  const tokens = tokenize(args);

  if (args.length === 0) {
    return { kind: "help", explicit: false };
  }
  if (tokens.values.help) {
    return { kind: "help", explicit: true };
  }
  if (tokens.values.version) {
    return { kind: "version" };
  }

  const [input, ...extraPositionals] = tokens.positionals;
  if (extraPositionals.length > 0) {
    const joined = extraPositionals.join(" ");
    throw new UsageError(`unexpected extra argument: ${joined}`);
  }

  const raw = {
    input,
    output: tokens.values.output,
    guessLang: tokens.values["guess-lang"] ?? false
  };

  const parsed = convertOptionsSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => issue.message).join("; ");
    throw new UsageError(message);
  }
  return { kind: "convert", options: parsed.data };
};

const tokenize = (args: string[]) => {
  try {
    return parseArgs({
      args,
      allowPositionals: true,
      strict: true,
      options: {
        output: { type: "string", short: "o" },
        "guess-lang": { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new UsageError(message);
  }
};
