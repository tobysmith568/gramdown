// Shared, site-wide constants - the values that would otherwise be copy-pasted
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

// The three legal pages, in the order the Footer lists them and the policy rail
// links them. Shared so the two can't drift apart.
export const legalPages = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" }
];
