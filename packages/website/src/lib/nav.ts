/**
 * Working out which primary-nav / sidebar link is the current page. The built
 * pages are `*.html` and Astro serves them with and without a trailing slash, so
 * the live pathname has to be normalised before it is compared to a link's
 * `href`.
 */

/** `/docs/cli.html` -> `/docs/cli`; `/docs/` -> `/docs`; `/` stays `/`. */
export const normalizePathname = (pathname: string): string =>
  pathname.replace(/\.html$/, "").replace(/(.)\/$/, "$1");

/**
 * Whether a nav link pointing at `href` represents `currentPath` - either the
 * exact page or a section landing page one or more levels above it. Anchor and
 * off-site hrefs are never active.
 */
export const isActivePath = (currentPath: string, href: string): boolean =>
  href.startsWith("/") &&
  !href.includes("#") &&
  (currentPath === href || currentPath.startsWith(href + "/"));
