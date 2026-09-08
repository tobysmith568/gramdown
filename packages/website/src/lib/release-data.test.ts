import { describe, expect, it } from "bun:test";
import { formatBytes, toReleaseDownloads, type GithubRelease } from "./release-data";

describe("formatBytes", () => {
  it("uses MB with one decimal at or above a megabyte", () => {
    expect(formatBytes(92_700_000)).toBe("92.7 MB");
    expect(formatBytes(1_000_000)).toBe("1.0 MB");
  });

  it("uses whole KB below a megabyte", () => {
    expect(formatBytes(48_000)).toBe("48 KB");
    expect(formatBytes(1_500)).toBe("2 KB");
  });

  it("never reports 0 KB for a tiny non-zero file", () => {
    expect(formatBytes(10)).toBe("1 KB");
  });
});

const release = (assets: GithubRelease["assets"]): GithubRelease => ({
  tag_name: "v1.2.3",
  published_at: "2026-01-02T03:04:05Z",
  html_url: "https://github.com/tobysmith568/gramdown/releases/tag/v1.2.3",
  assets
});

describe("toReleaseDownloads", () => {
  it("lists the five known platforms in table order", () => {
    const result = toReleaseDownloads(null);

    expect(result.platforms.map(p => p.assetName)).toEqual([
      "gramdown-linux-x64",
      "gramdown-linux-arm64",
      "gramdown-darwin-arm64",
      "gramdown-darwin-x64",
      "gramdown-windows-x64.exe"
    ]);
  });

  describe("with no release (fetch failed)", () => {
    const result = toReleaseDownloads(null);

    it("has no version, date or notes", () => {
      expect(result.version).toBeNull();
      expect(result.publishedAt).toBeNull();
      expect(result.notesUrl).toBeNull();
    });

    it("points every platform at the permanent latest-download redirect", () => {
      for (const platform of result.platforms) {
        expect(platform.downloadUrl).toBe(
          `https://github.com/tobysmith568/gramdown/releases/latest/download/${platform.assetName}`
        );
        expect(platform.sizeLabel).toBeNull();
      }
    });

    it("falls back to the unpinned install command", () => {
      expect(result.installCommand).toBe("npm install -g gramdown");
    });

    it("still offers a checksums URL via the redirect", () => {
      expect(result.checksumsUrl).toBe(
        "https://github.com/tobysmith568/gramdown/releases/latest/download/SHA256SUMS.txt"
      );
    });
  });

  describe("with a real release", () => {
    const result = toReleaseDownloads(
      release([
        {
          name: "gramdown-linux-x64",
          browser_download_url: "https://example.com/linux",
          size: 92_700_000
        },
        {
          name: "SHA256SUMS.txt",
          browser_download_url: "https://example.com/sums",
          size: 400
        }
      ])
    );

    it("carries the version, date and notes URL", () => {
      expect(result.version).toBe("v1.2.3");
      expect(result.publishedAt).toBe("2026-01-02T03:04:05Z");
      expect(result.notesUrl).toBe("https://github.com/tobysmith568/gramdown/releases/tag/v1.2.3");
    });

    it("pins the install command to the version without its leading v", () => {
      expect(result.installCommand).toBe("npm install -g gramdown@1.2.3");
    });

    it("uses the asset's own URL and size when the release has it", () => {
      const linux = result.platforms.find(p => p.assetName === "gramdown-linux-x64");
      expect(linux?.downloadUrl).toBe("https://example.com/linux");
      expect(linux?.sizeLabel).toBe("92.7 MB");
    });

    it("uses the asset URL for the checksums file when present", () => {
      expect(result.checksumsUrl).toBe("https://example.com/sums");
    });

    it("falls back per-asset for a platform the release is missing", () => {
      const windows = result.platforms.find(p => p.assetName === "gramdown-windows-x64.exe");
      expect(windows?.downloadUrl).toBe(
        "https://github.com/tobysmith568/gramdown/releases/latest/download/gramdown-windows-x64.exe"
      );
      expect(windows?.sizeLabel).toBeNull();
    });
  });
});
