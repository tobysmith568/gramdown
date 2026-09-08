/**
 * The two bits of `<head>` string logic `Seo.astro` needs: decorating a page's
 * bare title with the wordmark, and turning the built `*.html` request path back
 * into the extensionless path the page is actually served and linked at (which
 * is what the canonical URL and the sitemap must agree on).
 */

import { siteName } from "../consts";

// "gramdown" alone tells a search result nothing, so the index (which passes no
// title) gets the site title with its tagline rather than the bare wordmark.
const siteTitle = `${siteName} - Convert Grammarly .docx exports to Markdown`;

/** `"CLI reference"` -> `"CLI reference - gramdown"`; no title -> the site title. */
export const decorateTitle = (pageTitle: string | undefined): string =>
  pageTitle ? `${pageTitle} - ${siteName}` : siteTitle;

/**
 * `build.format: "file"` makes the built pathname the emitted filename
 * (`/docs/cli.html`, `/index.html`), but the page is served, linked and listed
 * in the sitemap at the extensionless path. Strip the `.html` (and a bare
 * `index.html`) so the canonical matches.
 */
export const servedPathname = (pathname: string): string =>
  pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
