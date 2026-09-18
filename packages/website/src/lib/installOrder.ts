export type MethodId = "shell" | "binary" | "npm" | "brew";

export const fallbackOrder: MethodId[] = ["shell", "binary", "npm", "brew"];

/**
 * Client-only OS detection, reordering (and on some platforms, trimming) the
 * install methods to lead with whatever's most relevant. Server-rendered
 * markup always starts from `fallbackOrder` instead - callers read the real
 * order from a lazy `useState` initializer (not an effect: that runs once,
 * synchronously, during hydration itself, so there's no flash between a
 * fallback paint and a corrected one).
 *
 * Also always `fallbackOrder` for anything that looks like a crawler or
 * automated tool, deliberately rather than incidentally: search engines
 * (Googlebot's dominant crawl profile is Android-flavoured, not desktop
 * Linux, which is why the Android check exists ahead of the Linux one
 * below), link-preview bots and headless-browser tooling should all see the
 * same broad, unnarrowed default a search index or a shared link preview
 * would want - not whatever OS string their renderer happens to send.
 *
 * Reflects today's real availability, not the eventual matrix: Homebrew
 * never runs on Windows, the shell installer is Linux/macOS only, and
 * Homebrew-on-Linux isn't shipped yet either. WinGet isn't listed anywhere
 * yet because it isn't actually installable until its own PR lands upstream.
 */
export const detectOrder = (): MethodId[] => {
  if (typeof navigator === "undefined") {
    return fallbackOrder;
  }

  const ua = navigator.userAgent;
  if (crawlerUaPattern.test(ua)) {
    return fallbackOrder;
  }
  if (/Windows/.test(ua)) {
    return orderByOs.windows;
  }
  if (/Android/.test(ua)) {
    return fallbackOrder;
  }
  if (/Linux/.test(ua)) {
    return orderByOs.linux;
  }
  if (/Mac OS X|Macintosh/.test(ua)) {
    return orderByOs.mac;
  }
  return fallbackOrder;
};

const orderByOs: Record<"mac" | "windows" | "linux", MethodId[]> = {
  mac: ["brew", "shell", "npm", "binary"],
  linux: ["shell", "npm", "binary"],
  windows: ["npm", "binary"]
};

const crawlerUaPattern =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|whatsapp|telegrambot|discordbot|slackbot|w3c_validator|lighthouse|headlesschrome/i;
