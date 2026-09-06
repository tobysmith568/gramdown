// Shared, site-wide constants — the values that would otherwise be copy-pasted
// across `Header`, `Footer`, `BaseLayout` and the pages.

// Wordmark and default <title>.
export const siteName = "gramdown";

// The published package names.
export const cliPackage = "gramdown";
export const corePackage = "@gramdown/core";

// External links.
export const repoUrl = "https://github.com/tobysmith568/gramdown";
export const releasesUrl = `${repoUrl}/releases`;
export const cliNpmUrl = `https://www.npmjs.com/package/${cliPackage}`;
export const coreNpmUrl = `https://www.npmjs.com/package/${corePackage}`;

// Temporary pre-launch flag: while `true`, the whole site asks search engines not
// to crawl or index it (robots.txt `Disallow: /` + a site-wide `noindex, nofollow`
// meta tag). This lets the site ship early — live at the real URL for development
// and sharing — without it turning up in search results before it's ready.
//
// Flip to `false` (or delete this flag and its two call sites) as the launch step
// — see milestone 8.12 in docs/milestone-8-website.md.
export const indexingDisabled = true;
