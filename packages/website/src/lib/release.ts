/**
 * Build-time lookup of the latest GitHub release, so the downloads table on the
 * index page can show the real version, publish date and per-file sizes. The
 * top-level `await` here runs once during `astro build` (the index page imports
 * `releaseDownloads`) and the result is inlined into the static HTML.
 *
 * Fails soft: a network error, a missing release or a rate-limit all fall back
 * to GitHub's permanent `releases/latest/download/<asset>` redirects with no
 * version label. This must never fail the build.
 *
 * In CI the build step passes `GITHUB_TOKEN` through so the API call is
 * authenticated (unauthenticated requests from shared Actions IPs are routinely
 * rate-limited); locally the unauthenticated 60/hour budget is plenty.
 */

import { cliPackage, repoUrl } from "../consts";

export interface PlatformDownload {
  label: string;
  assetName: string;
  downloadUrl: string;
  sizeLabel: string | null;
}

export interface ReleaseDownloads {
  version: string | null;
  publishedAt: string | null;
  notesUrl: string | null;
  checksumsUrl: string;
  installCommand: string;
  platforms: PlatformDownload[];
}

interface GithubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GithubRelease {
  tag_name: string;
  published_at: string;
  html_url: string;
  assets: GithubAsset[];
}

// Every binary `scripts/compile-binaries.ts` produces, in the order they should
// appear in the table. `assetName` must match the compiled output name exactly.
const knownPlatforms: { label: string; assetName: string }[] = [
  { label: "Linux (x64)", assetName: "gramdown-linux-x64" },
  { label: "Linux (arm64)", assetName: "gramdown-linux-arm64" },
  { label: "macOS (Apple silicon)", assetName: "gramdown-darwin-arm64" },
  { label: "macOS (Intel)", assetName: "gramdown-darwin-x64" },
  { label: "Windows (x64)", assetName: "gramdown-windows-x64.exe" }
];

const checksumsAsset = "SHA256SUMS.txt";
const latestDownloadBase = `${repoUrl}/releases/latest/download`;
const apiBase = repoUrl.replace("https://github.com/", "https://api.github.com/repos/");
const latestReleaseUrl = `${apiBase}/releases/latest`;

const formatBytes = (bytes: number): string => {
  const megabytes = bytes / 1_000_000;
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const kilobytes = Math.max(1, Math.round(bytes / 1_000));
  return `${kilobytes} KB`;
};

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

  const platforms = knownPlatforms.map(platform => {
    const asset = release?.assets.find(candidate => candidate.name === platform.assetName);
    const downloadUrl =
      asset?.browser_download_url ?? `${latestDownloadBase}/${platform.assetName}`;
    const sizeLabel = asset ? formatBytes(asset.size) : null;

    return { label: platform.label, assetName: platform.assetName, downloadUrl, sizeLabel };
  });

  const checksumsAssetMatch = release?.assets.find(candidate => candidate.name === checksumsAsset);
  const checksumsUrl =
    checksumsAssetMatch?.browser_download_url ?? `${latestDownloadBase}/${checksumsAsset}`;

  const version = release?.tag_name ?? null;
  const pinnedVersion = version?.replace(/^v/, "");
  const installCommand = pinnedVersion
    ? `npm install -g ${cliPackage}@${pinnedVersion}`
    : `npm install -g ${cliPackage}`;

  return {
    version,
    publishedAt: release?.published_at ?? null,
    notesUrl: release?.html_url ?? null,
    checksumsUrl,
    installCommand,
    platforms
  };
};

export const releaseDownloads: ReleaseDownloads = await loadReleaseDownloads();
