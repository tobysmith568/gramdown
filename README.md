<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gramdown.tobythe.dev/banner-dark.png">
  <img alt="gramdown: clean Markdown from your Grammarly .docx exports" src="https://gramdown.tobythe.dev/banner.png">
</picture>

gramdown converts the `.docx` file you get from Grammarly's export into clean,
GitHub-Flavored Markdown. It is a command line tool for Linux, macOS and Windows,
a library you can call from your own code, and a converter that runs in your
browser without uploading anything.

**[gramdown.tobythe.dev](https://gramdown.tobythe.dev)** ·
[Documentation](https://gramdown.tobythe.dev/docs) ·
[Downloads](https://gramdown.tobythe.dev/docs/downloads) ·
[`gramdown` on npm](https://www.npmjs.com/package/gramdown) ·
[`@gramdown/core` on npm](https://www.npmjs.com/package/@gramdown/core)

## Quick start

```sh
npm install -g gramdown
gramdown draft.docx -o draft.md
```

`npx gramdown draft.docx -o draft.md` runs it without installing anything. If
there is no Node.js on the machine,
[download a standalone binary](https://gramdown.tobythe.dev/docs/downloads): a
single file that runs on its own. And if you would rather install nothing at all,
drop a `.docx` anywhere on [the website](https://gramdown.tobythe.dev) and it
converts on your device.

## Why a Grammarly-specific converter?

A Grammarly export is a Word document, but not a tidy one. It is awkward in a few
consistent ways: code is ordinary body text that happens to be set in Courier
New, indented with invisible non-breaking spaces; every link arrives underlined.
A general-purpose converter reads all of that literally, and cleaning up the
result (the code blocks worst of all) is most of the work.

gramdown only ever has to handle this one input, so it can treat those quirks as
signal instead. [How it works](https://gramdown.tobythe.dev/docs/how-it-works)
has the detail, including where it still has limits.

## Repository

| Package             | npm              | What it is                                                                                                   |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `packages/core`     | `@gramdown/core` | The conversion engine. Pure and I/O-free: `convert(bytes, options?) -> Promise<string>`.                     |
| `packages/cli`      | `gramdown`       | The `gramdown` command, and the `bin` that becomes the standalone binaries.                                  |
| `packages/website`  | -                | [gramdown.tobythe.dev](https://gramdown.tobythe.dev): the pitch, the docs, and the browser converter. Astro. |
| `packages/fixtures` | -                | Real Grammarly `.docx` exports, shared by every package's tests.                                             |

A bun workspace driven by [turbo](https://turbo.build). `@gramdown/core` is the
bottom of the stack: the CLI and the website are both wrappers around it, and it
depends on neither.

## Working on it

```sh
bun install

bun run build       # tsdown for the packages, astro for the website
bun run typecheck
bun run lint
bun run test
bun run check       # all four, in dependency order

bun run format      # prettier, whole repo (not per-package)
```

Run a task for one package with turbo's filter:

```sh
bunx turbo run build --filter=@gramdown/core
bunx turbo run test  --filter=gramdown           # builds core first, via ^build
bunx turbo run dev   --filter=@gramdown/website  # http://localhost:4321
```

Two more, run by CI rather than day to day:

```sh
bun run compile:binaries   # the per-platform standalone binaries
bun run brand:assets       # re-render brand/*.svg into the website's public assets
```

Every pull request and every push to `main` runs **Integration**: format, lint,
typecheck, build, test, the binaries, a pack and CodeQL, each as its own job.

A release is a manual `workflow_dispatch` on **Deployment**, taking the SemVer
version to publish. It stamps that version across the packages, runs Integration
against it, publishes both packages to npm with provenance, cuts a GitHub release
with the standalone binaries and their checksums attached, and redeploys the
website.

## License

The two published packages, [`gramdown`](./packages/cli) and
[`@gramdown/core`](./packages/core), are **[ISC](./LICENSE.md)**. Use them for
whatever you like.

**The website is not.** [`packages/website`](./packages/website) is _source open,
not open source_: it is copyrighted and is not available for re-distribution or
re-use. The code is in this repository to be read, not to be taken. See
[its license](./packages/website/LICENSE.md).

Copyright © 2026 Toby Smith.
