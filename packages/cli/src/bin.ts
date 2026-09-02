#!/usr/bin/env node
// The executable entry point: everything worth testing lives in `cli.ts`.
//
// This deliberately runs unconditionally rather than checking whether it was
// invoked directly — a compiled single-file binary runs from a virtual path
// that no `import.meta.url` comparison can match.

import process from "node:process";
import { defaultIo, run } from "./cli";

run(process.argv)
  .then(code => process.exit(code))
  .catch((error: unknown) => {
    defaultIo.stderr(`error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
