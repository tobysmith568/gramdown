# @gramdown/website

[gramdown.tobythe.dev](https://gramdown.tobythe.dev): the gramdown home page,
its documentation, and a converter that runs a Grammarly `.docx` through
[`@gramdown/core`](../core) in your own browser, with no upload and no server.

Built with [Astro](https://astro.build), with [Preact](https://preactjs.com) for
the converter's interactive parts. Static output, deployed to GitHub Pages.

```sh
bun install                                     # from the repository root
bunx turbo run dev --filter=@gramdown/website   # http://localhost:4321
```

`build`, `typecheck` and `lint` all run through turbo the same way. See the
[repository README](../../README.md) for the whole workspace.

## License

**This package is not open source.** It is source open: the code is in the
repository to be read, not to be taken. It is copyrighted and is not available
for re-distribution or re-use; see [LICENSE.md](./LICENSE.md).

This is the one exception in the repository. The published `gramdown` and
`@gramdown/core` packages are [ISC](../../LICENSE.md), and you are welcome to do
whatever the ISC license allows with them.
