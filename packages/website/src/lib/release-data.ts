/**
 * The pure shaping half of the build-time downloads lookup: given the raw
 * "latest release" payload from the GitHub API (or `null` when the fetch failed),
 * work out the download table the index and `/docs/downloads` render.
 *
 * `release.ts` owns the actual `fetch` and the top-level `await`; keeping the
 * transform here means it can be tested without a network round-trip.
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

export interface GithubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GithubRelease {
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

/** A byte count as a short human label: `92.7 MB`, `48 KB`. */
export const formatBytes = (bytes: number): string => {
  const megabytes = bytes / 1_000_000;
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const kilobytes = Math.max(1, Math.round(bytes / 1_000));
  return `${kilobytes} KB`;
};

/**
 * Map a GitHub release (or `null`) onto the download table. With `null` - or a
 * release missing an expected asset - every link falls back to GitHub's
 * permanent `releases/latest/download/<asset>` redirect and carries no size or
 * version label.
 */
export const toReleaseDownloads = (release: GithubRelease | null): ReleaseDownloads => {
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
