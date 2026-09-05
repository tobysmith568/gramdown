import { z } from "zod";

/**
 * The contract for a `convert` invocation: what a valid command line reduces to
 * once flags and the positional are resolved. `parse.ts` feeds the raw tokens
 * from `node:util.parseArgs` through here, so this is the single place the
 * rules live.
 */
export const convertOptionsSchema = z.object({
  input: z
    .string({ error: "no input .docx file given" })
    .refine(path => path.toLowerCase().endsWith(".docx"), {
      error: "the input file must be a .docx export"
    }),
  output: z.string().min(1, { error: "--output needs a file path" }).optional(),
  guessLang: z.boolean()
});

export type ConvertOptions = z.infer<typeof convertOptionsSchema>;
