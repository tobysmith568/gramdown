/**
 * Raised when the command line itself is wrong — an unknown flag, a missing
 * value, a bad `.docx` path. `main` catches it, prints the message plus a usage
 * reminder, and exits with `exitCode`.
 *
 * Failures that happen *after* a valid command line (file not found, an
 * unreadable archive) are not `UsageError`s — the command handler reports those
 * itself, since a usage reminder would not help.
 */
export class UsageError extends Error {
  readonly exitCode = 1;

  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
