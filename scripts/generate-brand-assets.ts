// Render the raster brand assets the website ships, from the SVG masters in `brand/`.
//
//   bun run brand:assets
//
// Everything it writes into `packages/website/public/` is committed, so this only needs
// running when a master in `brand/` changes. Headless Chrome does the rasterising: it is
// the same engine that draws `favicon.svg` in the wild, and it is already on the machine,
// so no image toolchain (and no third-party favicon service) is involved.
//
// What the website links, and why only these four:
//   favicon.svg          every current browser. It is the only one of these that can carry
//                        a light/dark swap at all, though only some browsers honour it.
//   favicon.ico          16/32/48, transparent, for the clients that hardcode
//                        `/favicon.ico` and do not read SVG. Default colours only: ICO
//                        has no media queries.
//   apple-touch-icon.png 180x180, opaque and padded, for the iOS home screen.
//   og.png               the 1200x630 social card.
// It also copies the mark into the website's own `src/assets`, for the header to inline.
// No `.webmanifest` and no `mstile-*`: nothing reads them, and this is not an installable
// app. That is the whole modern set, which is why there is no favicon-generator service in
// the loop.

import { $ } from "bun";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

interface Face {
  family: string;
  weight: number;
  /** Path within `@fontsource`, from the same packages the site self-hosts. */
  file: string;
}

interface RenderOptions {
  /** Page ground behind the SVG. Omitted means a transparent capture. */
  background?: string;
  /** Pixels of clear space on every side, inside the given width and height. */
  inset?: number;
}

interface IcoFrame {
  /** Square edge in pixels, which is also what the directory entry records. */
  size: number;
  png: Buffer;
}

// The ground for the outputs that need one. `favicon.svg` deliberately has none (an opaque
// square can never match the tab strip behind it), but an iOS home-screen icon must be
// opaque or the transparency composites to black.
const paper = "#f5efe3";

// Apple rounds and masks the home-screen icon, so it wants more clear space than a favicon.
// A tenth of the edge on every side is the usual allowance.
const touchIconSize = 180;
const touchIconInset = Math.round(touchIconSize * 0.1);

// The sizes Windows and the legacy clients actually pick between.
const icoSizes = [16, 32, 48];

const faces: Face[] = [
  {
    family: "IBM Plex Mono",
    weight: 600,
    file: "ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2"
  },
  {
    family: "IBM Plex Sans",
    weight: 400,
    file: "ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2"
  }
];

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const brandDir = join(repoRoot, "brand");
const publicDir = join(repoRoot, "packages", "website", "public");
const assetsDir = join(repoRoot, "packages", "website", "src", "assets");
const fontsDir = join(repoRoot, "packages", "website", "node_modules", "@fontsource");

const workDir = await mkdtemp(join(tmpdir(), "gramdown-brand-"));

// Self-hosted @font-face rules with the woff2 inlined as data URIs. A `file://` page cannot
// fetch a sibling font in Chrome, so the bytes have to travel in the stylesheet.
const buildFontCss = async (): Promise<string> => {
  const rules: string[] = [];

  for (const { family, weight, file } of faces) {
    const bytes = await Bun.file(join(fontsDir, file)).bytes();
    const base64 = Buffer.from(bytes).toString("base64");
    const src = `url(data:font/woff2;base64,${base64}) format("woff2")`;

    rules.push(
      `@font-face { font-family: "${family}"; font-weight: ${weight};` +
        ` font-display: block; src: ${src}; }`
    );
  }

  const css = rules.join("\n");

  return css;
};

// The SVG is inlined into the page rather than loaded through an <img>: an <img>-loaded SVG
// is an isolated document and cannot see the wrapper's @font-face rules, so the lockup's
// IBM Plex text would silently fall back to a system face.
const render = async (
  source: string,
  width: number,
  height: number,
  options: RenderOptions = {}
): Promise<Buffer> => {
  const { background, inset = 0 } = options;

  const ground = background ?? "transparent";
  const page = `<!doctype html>
<meta charset="utf-8">
<style>
${fontCss}
html, body { margin: 0; padding: 0; background: ${ground}; }
svg { display: block; margin: ${inset}px; width: ${width - inset * 2}px; height: ${height - inset * 2}px; }
</style>
${source}`;

  const pagePath = join(workDir, `page-${width}x${height}.html`);
  const outPath = join(workDir, `out-${width}x${height}.png`);

  await writeFile(pagePath, page);

  // `--virtual-time-budget` lets the data-URI faces finish loading before the capture;
  // without it a cold run can screenshot the fallback face.
  const flags = [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--virtual-time-budget=4000",
    // Chrome paints its own white behind the page unless told otherwise, which would
    // quietly re-ground the icons this whole change exists to un-ground.
    `--default-background-color=${background ? "ffffffff" : "00000000"}`,
    `--window-size=${width},${height}`,
    `--screenshot=${outPath}`,
    `file://${pagePath}`
  ];

  await $`google-chrome ${flags}`.quiet();

  const png = await Bun.file(outPath).bytes();
  const buffer = Buffer.from(png);

  return buffer;
};

// An ICO is a 6-byte directory header, one 16-byte entry per image, then the images. The
// payloads here are whole PNG files, which every client this file exists for has understood
// for a decade; there is no need to emit uncompressed BMP frames.
const buildIco = (frames: IcoFrame[]): Buffer => {
  const headerLength = 6 + frames.length * 16;

  const header = Buffer.alloc(headerLength);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(frames.length, 4);

  let offset = headerLength;

  frames.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;

    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt8(0, entry + 2); // palette size; 0 for truecolour
    header.writeUInt8(0, entry + 3); // reserved
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);

    offset += png.length;
  });

  const payloads = frames.map(frame => frame.png);
  const ico = Buffer.concat([header, ...payloads]);

  return ico;
};

// `favicon.svg` is served standalone as image/svg+xml, so it is parsed as strict XML rather
// than with HTML's forgiving rules, and a browser drops the whole document on a parse error
// (a blank favicon, with nothing said about why). A double hyphen inside a comment is the
// easy way to trip that, because the site's token names all start with one.
const readMaster = async (name: string): Promise<string> => {
  const source = await Bun.file(join(brandDir, name)).text();
  const comments = source.matchAll(/<!--(.*?)-->/gs);

  for (const match of comments) {
    const body = match[1] ?? "";

    if (body.includes("--")) {
      throw new Error(
        `${name}: a comment contains a double hyphen, which XML forbids. Write token names ` +
          `without their leading dashes ("source", not the custom-property spelling).`
      );
    }
  }

  return source;
};

// The header inlines the mark into the markup of every page, so the copy it imports is
// stripped of the master's comments (they are for whoever opens the file, not for eleven
// pages of HTML) and given a banner outside the root element, which the SVG loader drops.
//
// The copy is not only tidiness. Turbo keys a package's build cache on that package's own
// files, so a header importing straight from `brand/` kept replaying a stale `dist/` after
// the mark changed. Landing the mark inside the website makes it an input Turbo can see.
const toInlineMark = (source: string): string => {
  const banner =
    "<!-- Generated from brand/mark.svg by scripts/generate-brand-assets.ts. Do not edit. -->";

  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, "");
  const collapsed = withoutComments.replace(/\n\s*\n+/g, "\n").trim();

  return `${banner}\n${collapsed}\n`;
};

const fontCss = await buildFontCss();

try {
  // The SVG favicon ships as-is: it is the master, and the browsers that honour its
  // `prefers-color-scheme` block read it straight.
  const faviconSvg = await readMaster("favicon.svg");
  await writeFile(join(publicDir, "favicon.svg"), faviconSvg);

  // The one output that gets a ground put back under it, plus the clear space iOS wants.
  const appleTouchIcon = await render(faviconSvg, touchIconSize, touchIconSize, {
    background: paper,
    inset: touchIconInset
  });
  await writeFile(join(publicDir, "apple-touch-icon.png"), appleTouchIcon);

  const icoFrames: IcoFrame[] = [];

  for (const size of icoSizes) {
    const png = await render(faviconSvg, size, size);
    icoFrames.push({ size, png });
  }

  const ico = buildIco(icoFrames);
  await writeFile(join(publicDir, "favicon.ico"), ico);

  const markSvg = await readMaster("mark.svg");
  const inlineMark = toInlineMark(markSvg);
  await writeFile(join(assetsDir, "mark.svg"), inlineMark);

  // The lockup paints its own full-bleed ground, so the page behind it only shows if it
  // ever stops doing that; paper keeps that failure quiet.
  const lockupSvg = await readMaster("og-lockup.svg");
  const og = await render(lockupSvg, 1200, 630, { background: paper });
  await writeFile(join(publicDir, "og.png"), og);

  console.log(`Wrote favicon.svg, favicon.ico, apple-touch-icon.png and og.png to ${publicDir}`);
  console.log(`Wrote mark.svg to ${assetsDir}`);
} finally {
  await rm(workDir, { recursive: true, force: true });
}
