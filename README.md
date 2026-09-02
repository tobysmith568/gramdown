# gramdown

Convert Grammarly `.docx` exports to Markdown. Pure JS — no system dependencies —
installable from npm and compilable to a single self-contained binary with
`bun build --compile`.

## Workspace layout

| Package         | npm name         | Purpose                                          |
| --------------- | ---------------- | ----------------------------------------------- |
| `packages/core` | `@gramdown/core` | Pure, I/O-free `convert(bytes, opts) -> string`. |
| `packages/cli`  | `gramdown`       | `gramdown <file.docx>` CLI wrapper + `bin`.      |

## Scripts

`build`, `typecheck`, `lint` and `test` all run through turbo (each package
owns its own script):

```bash
bun install
bun run build       # turbo run build      -> tsc -p tsconfig.build.json
bun run typecheck   # turbo run typecheck  -> tsc -p tsconfig.json
bun run lint        # turbo run lint       -> eslint src
bun run test        # turbo run test       -> bun test
bun run check       # turbo run build typecheck lint test

bun run format      # prettier (whole repo, not per-package)
```

Run a task for one package with turbo's filter:

```bash
bunx turbo run build --filter=@gramdown/core
bunx turbo run test  --filter=gramdown   # builds core first via ^build
```

## License

ISC
