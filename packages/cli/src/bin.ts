#!/usr/bin/env node
// The executable entry point. Everything worth testing lives in `main.ts`; this
// file is only the `process` glue.
//
// `run` is invoked unconditionally rather than guarded by an
// `import.meta.url`-vs-argv check — a compiled single-file binary runs from a
// virtual path that no such comparison can match.

import process from "node:process";
import { defaultIo } from "./io";
import { run } from "./main";

run(process.argv)
  .then(code => process.exit(code))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    defaultIo.stderr(`error: ${message}\n`);
    process.exit(1);
  });
