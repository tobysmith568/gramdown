<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gramdown.tobythe.dev/banner-dark.png">
  <img alt="gramdown: clean Markdown from your Grammarly .docx exports" src="https://gramdown.tobythe.dev/banner.png">
</picture>

# @gramdown/core

The conversion engine behind [gramdown](https://gramdown.tobythe.dev): it turns the `.docx` file Grammarly hands you when you export a document into clean, GitHub-Flavored Markdown.

It is built for that one file. A Grammarly export has a handful of specific quirks: code set in a plain monospace font with no language, links that arrive underlined, indentation made of invisible characters. This package is designed around them rather than trying to be a general-purpose `.docx` converter.

It is also pure and I/O-free: no `fs`, no paths, no `process`. The same call works in Node, in a bundler and in a Web Worker. The `gramdown` command and the browser converter on the website are both wrappers around it.

> Converting a file on your own machine? Install **[`gramdown`](https://www.npmjs.com/package/gramdown)** instead: it is the command line tool, and this is the library underneath it.

## Install

```sh
npm install @gramdown/core
```

## Use

```ts
import { convert } from "@gramdown/core";

const bytes = new Uint8Array(await file.arrayBuffer());
const markdown = await convert(bytes);
```

`convert(bytes, options?)` takes the raw bytes of a Grammarly `.docx` export and resolves to a Markdown string. In Node, `readFile` already gives you something `convert` accepts.

It throws `InvalidDocxError` when the input is not a readable `.docx`: the bytes are empty, the archive cannot be opened, or it is not a Word document. Nothing else is thrown; a successful parse always resolves, warnings and all.

### Options

| Option          | Type                        | What it does                                                                                         |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `guessLanguage` | `LanguageGuesser`           | Called with each code block's text to produce a fence info string. Unset means unlabelled fences.    |
| `onWarning`     | `(warning: string) => void` | Receives every warning raised while reading the document (an unrecognised style, a dropped element). |

### Guessing code-fence languages

Grammarly records no language anywhere in the `.docx`, so there is nothing to recover; a language can only be guessed. A ready-made guesser ships as a separate subpath export, so callers who don't want it don't pay for its dependency:

```ts
import { convert } from "@gramdown/core";
import { languageGuesser } from "@gramdown/core/guess-lang";

const markdown = await convert(bytes, { guessLanguage: languageGuesser });
```

It is a heuristic: reliable for things like JSON and shell, shakier on JavaScript-vs-TypeScript, and it always needs a human pass. Pass your own `(code: string) => string | undefined` if you'd rather guess a different way, or leave the option unset and get bare fences.

## Documentation

- [`convert()` API reference](https://gramdown.tobythe.dev/docs/api): every option, error and export, in full.
- [How it works](https://gramdown.tobythe.dev/docs/how-it-works): what a Grammarly export actually looks like, the four stages of the conversion, and the limitations that come with them.
- [gramdown.tobythe.dev](https://gramdown.tobythe.dev): the command line tool, the standalone binaries, and a converter that runs in your browser.

## License

ISC. See [LICENSE.md](https://github.com/tobysmith568/gramdown/blob/main/packages/core/LICENSE.md).
