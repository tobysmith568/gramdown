// A dedicated Web Worker has no `document` and no `DOMParser`, but turndown (via
// `@gramdown/core`) needs to parse an HTML string into a DOM. turndown's browser
// build looks for `window.DOMParser`; not finding it in a worker, it falls back
// to code that dereferences `document` - hence `ReferenceError: document is not
// defined`.
//
// Give it exactly what it probes for: a `window.DOMParser` whose `parseFromString`
// is backed by `@mixmark-io/domino`, a dependency-free JS DOM. This is narrower
// (and cheaper in dev) than aliasing turndown to its Node build, and it leaves
// mammoth's own environment detection untouched.
//
// `convert.worker.ts` imports this before `@gramdown/core` so turndown sees
// `window.DOMParser` at its module-evaluation time.

import domino from "@mixmark-io/domino";

class DominoDOMParser {
  parseFromString(markup: string): Document {
    return domino.createDocument(markup, true);
  }
}

// `globalThis` is typed with the full DOM `Window` here; the double assertion is
// deliberate - in a worker `window` is genuinely absent until this runs.
const shimTarget = globalThis as unknown as { window?: { DOMParser?: unknown } };

shimTarget.window ??= {};
shimTarget.window.DOMParser ??= DominoDOMParser;
