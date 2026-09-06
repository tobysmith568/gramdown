// Cross-compile the `gramdown` CLI into a standalone executable for every
// release target and drop the results in `dist-bin/`.
//
//   bun run compile:binaries
//
// Bun downloads each target's runtime on demand, so every binary is produced
// from a single machine regardless of its own OS or architecture.

import { $ } from "bun";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

interface Target {
  /** Bun's `--target` triple. */
  bun: string;
  /** The suffix that identifies the artifact to a person downloading it. */
  label: string;
  /** Windows executables need the `.exe` extension to run. */
  extension: string;
}

const allTargets: Target[] = [
  { bun: "bun-linux-x64", label: "linux-x64", extension: "" },
  { bun: "bun-linux-arm64", label: "linux-arm64", extension: "" },
  { bun: "bun-darwin-x64", label: "darwin-x64", extension: "" },
  { bun: "bun-darwin-arm64", label: "darwin-arm64", extension: "" },
  { bun: "bun-windows-x64", label: "windows-x64", extension: ".exe" }
];

// `GRAMDOWN_TARGETS=linux-x64,darwin-arm64` narrows the build — CI uses it to
// compile only one target on pull requests and the full set on a release.
const requestedValue = process.env.GRAMDOWN_TARGETS?.trim();
const requestedLabels = requestedValue
  ? requestedValue.split(",").map(label => label.trim())
  : undefined;

const targets = requestedLabels
  ? allTargets.filter(target => requestedLabels.includes(target.label))
  : allTargets;

if (targets.length === 0) {
  console.error(`No known targets in GRAMDOWN_TARGETS="${process.env.GRAMDOWN_TARGETS}"`);
  process.exit(1);
}

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const outDir = `${repoRoot}dist-bin`;
const cliEntry = `${repoRoot}packages/cli/src/bin.ts`;

// `@gramdown/core` is resolved through its built `dist`, so it has to exist
// before the CLI can be bundled. Turbo skips the work when it is already fresh.
await $`bunx turbo run build --filter=@gramdown/core`.cwd(repoRoot);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const target of targets) {
  const outFile = `${outDir}/gramdown-${target.label}${target.extension}`;

  console.log(`Compiling ${target.label}...`);
  await $`bun build ${cliEntry} --compile --minify --bytecode --target=${target.bun} --outfile=${outFile}`.cwd(
    `${repoRoot}packages/cli`
  );
}

console.log(`\nWrote ${targets.length} binaries to dist-bin/`);
