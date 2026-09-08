import { describe, expect, it } from "bun:test";
import { isActivePath, normalizePathname } from "./nav";

describe("normalizePathname", () => {
  it("drops a .html extension", () => {
    expect(normalizePathname("/docs/cli.html")).toBe("/docs/cli");
  });

  it("drops a trailing slash but never the root slash", () => {
    expect(normalizePathname("/docs/")).toBe("/docs");
    expect(normalizePathname("/")).toBe("/");
  });

  it("leaves a clean path alone", () => {
    expect(normalizePathname("/docs/cli")).toBe("/docs/cli");
  });
});

describe("isActivePath", () => {
  it("matches the exact page", () => {
    expect(isActivePath("/docs", "/docs")).toBe(true);
  });

  it("matches a section landing page for a page beneath it", () => {
    expect(isActivePath("/docs/cli", "/docs")).toBe(true);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isActivePath("/docs-archive", "/docs")).toBe(false);
  });

  it("does not match an unrelated page", () => {
    expect(isActivePath("/terms", "/docs")).toBe(false);
  });

  it("is never active for an anchor or an off-site link", () => {
    expect(isActivePath("/", "/#converter")).toBe(false);
    expect(isActivePath("/", "https://github.com/tobysmith568/gramdown")).toBe(false);
  });
});
