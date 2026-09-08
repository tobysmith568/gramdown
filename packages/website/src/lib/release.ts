/**
 * Build-time lookup of the latest GitHub release, so the downloads table on the
 * `/docs/downloads` page can show the real version, publish date and per-file
 * sizes. The top-level `await` here runs once during `astro build` (the page
 * imports `releaseDownloads`) and the result is inlined into the static HTML.
 *
 * Fails soft: a network error, a missing release or a rate-limit all fall back
 * to GitHub's permanent `releases/latest/download/<asset>` redirects with no
 * version label (see `toReleaseDownloads`). This must never fail the build.
 *
 * In CI the build step passes `GITHUB_TOKEN` through so the API call is
 * authenticated (unauthenticated requests from shared Actions IPs are routinely
 * rate-limited); locally the unauthenticated 60/hour budget is plenty.
 */

import { repoUrl } from "../consts";
import { toReleaseDownloads, type GithubRelease, type ReleaseDownloads } from "./release-data";

export type { ReleaseDownloads } from "./release-data";

const apiBase = repoUrl.replace("https://github.com/", "https://api.github.com/repos/");
const latestReleaseUrl = `${apiBase}/releases/latest`;

const fetchLatestRelease = async (): Promise<GithubRelease | null> => {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(latestReleaseUrl, { headers });
    if (!response.ok) {
      console.warn(
        `[release] GitHub API returned ${response.status}; falling back to static download links`
      );
      return null;
    }

    const release = (await response.json()) as GithubRelease;
    return release;
  } catch (error) {
    console.warn(
      "[release] could not reach the GitHub API; falling back to static download links",
      error
    );
    return null;
  }
};

const loadReleaseDownloads = async (): Promise<ReleaseDownloads> => {
  const release = await fetchLatestRelease();
  return toReleaseDownloads(release);
};

export const releaseDownloads: ReleaseDownloads = await loadReleaseDownloads();
