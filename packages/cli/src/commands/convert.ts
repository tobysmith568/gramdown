import { InvalidDocxError, convert } from "@gramdown/core";
import type { ConvertOptions } from "../args/schema";
import { type Io, isFileNotFoundError } from "../io";
import { languageGuesser } from "../lang/guess";

/** Read the input, convert it, and write the Markdown. Returns an exit code. */
export const runConvert = async (options: ConvertOptions, io: Io): Promise<number> => {
  let bytes: Uint8Array;
  try {
    bytes = await io.readFile(options.input);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      io.stderr(`error: no such file: ${options.input}\n`);
      return 1;
    }
    throw error;
  }

  const guessLanguage = options.guessLang ? languageGuesser : undefined;

  let markdown: string;
  try {
    markdown = await convert(bytes, {
      guessLanguage,
      onWarning: warning => io.stderr(`warning: ${warning}\n`)
    });
  } catch (error) {
    if (error instanceof InvalidDocxError) {
      io.stderr(`error: ${options.input}: ${error.message}\n`);
      return 1;
    }
    throw error;
  }

  if (options.output !== undefined) {
    await io.writeFile(options.output, markdown);
  } else {
    io.stdout(markdown);
  }
  return 0;
};
