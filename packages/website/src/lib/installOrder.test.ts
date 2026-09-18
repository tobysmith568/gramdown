import { afterEach, describe, expect, it } from "bun:test";
import { detectOrder, fallbackOrder } from "./installOrder";

describe("detectOrder", () => {
  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    }
  });

  it("returns the broad fallback when there's no navigator (SSR)", () => {
    Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });

    expect(detectOrder()).toEqual(fallbackOrder);
  });

  it("leads with Homebrew on macOS", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0"
    );

    expect(detectOrder()).toEqual(["brew", "shell", "npm", "binary"]);
  });

  it("drops the shell installer and Homebrew on Windows", () => {
    setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0");

    expect(detectOrder()).toEqual(["npm", "binary"]);
  });

  it("leads with the shell installer on desktop Linux", () => {
    setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0");

    expect(detectOrder()).toEqual(["shell", "npm", "binary"]);
  });

  it("falls back to the broad order for Android, rather than treating it as desktop Linux", () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile"
    );

    expect(detectOrder()).toEqual(fallbackOrder);
  });

  it("falls back to the broad order for an unrecognised OS", () => {
    setUserAgent("SomeExoticBrowser/1.0");

    expect(detectOrder()).toEqual(fallbackOrder);
  });

  it("falls back to the broad order for a headless tool, even with a real OS string", () => {
    // The exact scenario the crawler check exists for: a headless SEO/audit
    // tool running on Windows, which would otherwise be wrongly narrowed to
    // the npm/binary-only Windows order.
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36"
    );

    expect(detectOrder()).toEqual(fallbackOrder);
  });

  it("falls back to the broad order for Googlebot's Android-flavoured crawl UA", () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    );

    expect(detectOrder()).toEqual(fallbackOrder);
  });
});

describe("fallbackOrder", () => {
  it("includes every method exactly once", () => {
    expect(new Set(fallbackOrder)).toEqual(new Set(["shell", "binary", "npm", "brew"]));
  });
});

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

const setUserAgent = (ua: string) => {
  Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });
};
