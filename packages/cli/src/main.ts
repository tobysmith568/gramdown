import { type CliInvocation, parseCliArgs } from "./args/parse";
import { runConvert } from "./commands/convert";
import { UsageError } from "./errors";
import { usageText, versionText } from "./help";
import { defaultIo, type Io } from "./io";

/**
 * The CLI entry point, minus the `process` glue in `bin.ts`. Parses `argv`,
 * dispatches the one command, and maps every outcome to an exit code.
 */
export const run = async (argv: string[], io: Io = defaultIo): Promise<number> => {
  let invocation: CliInvocation;
  try {
    invocation = parseCliArgs(argv);
  } catch (error) {
    if (error instanceof UsageError) {
      const reminder = usageText();
      io.stderr(`error: ${error.message}\n\n${reminder}`);
      return error.exitCode;
    }
    throw error;
  }

  switch (invocation.kind) {
    case "help": {
      const help = usageText();
      io.stdout(help);
      return invocation.explicit ? 0 : 1;
    }
    case "version": {
      const version = versionText();
      io.stdout(`${version}\n`);
      return 0;
    }
    case "convert": {
      return runConvert(invocation.options, io);
    }
  }
};
