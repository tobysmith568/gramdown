<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gramdown.tobythe.dev/banner-dark.png">
  <img alt="gramdown: clean Markdown from your Grammarly .docx exports" src="https://gramdown.tobythe.dev/banner.png">
</picture>

gramdown converts the `.docx` file you get from Grammarly's export into clean, GitHub-Flavored Markdown. It is a command line tool, it is pure JavaScript, and it has no system dependencies: nothing to install alongside it.

## Install

```sh
npm install -g gramdown
```

Or run it without installing anything:

```sh
npx gramdown draft.docx -o draft.md
```

No Node.js on your machine? [Download a standalone binary](https://gramdown.tobythe.dev/docs/downloads) for Linux, macOS or Windows: a single file that runs on its own.

## Use

```sh
# print the Markdown to your terminal
gramdown draft.docx

# write it to a file instead
gramdown draft.docx -o draft.md

# guess a language for each code block
gramdown draft.docx -o draft.md --guess-lang

# pipe it somewhere else
gramdown draft.docx | pbcopy
```

### Options

| Flag                    | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `-o`, `--output <file>` | Write the Markdown to `<file>` instead of stdout.              |
| `--guess-lang`          | Label each code fence with a guessed language. Off by default. |
| `-h`, `--help`          | Print usage and exit.                                          |
| `-v`, `--version`       | Print the bare version string and exit.                        |

Without `-o` the Markdown goes to stdout and nothing else does, so redirecting and piping both work cleanly. Warnings go to stderr and don't change the exit code. The [CLI reference](https://gramdown.tobythe.dev/docs/cli) has every exit code and error case.

## Why a Grammarly-specific converter?

A Grammarly export is a Word document, but not a tidy one. It is awkward in a few consistent ways: code is ordinary body text in a monospace font, indented with invisible non-breaking spaces, and every hyperlink arrives underlined. A general-purpose markdown converter reads all these things literally meaning you're left with a document that needs cleaning manually.

gramdown only ever has to handle this one input source, so it's instead expecting those quirks. [How it works](https://gramdown.tobythe.dev/docs/how-it-works) has the detail, including where it still has limits.

## Other ways to run it

- **In your browser.** Drop a `.docx` anywhere on [gramdown.tobythe.dev](https://gramdown.tobythe.dev) and it converts on your device. Nothing is uploaded, and there is nothing to install.
- **From your own code.** [`@gramdown/core`](https://www.npmjs.com/package/@gramdown/core) is the conversion engine this command wraps: pure, I/O-free, and usable in Node, a bundler or a Web Worker.

## Documentation

Everything is at [gramdown.tobythe.dev/docs](https://gramdown.tobythe.dev/docs): the [CLI reference](https://gramdown.tobythe.dev/docs/cli), [standalone downloads](https://gramdown.tobythe.dev/docs/downloads), the [`convert()` API](https://gramdown.tobythe.dev/docs/api) and [how it works](https://gramdown.tobythe.dev/docs/how-it-works).

## License

ISC. See [LICENSE.md](https://github.com/tobysmith568/gramdown/blob/main/packages/cli/LICENSE.md).
