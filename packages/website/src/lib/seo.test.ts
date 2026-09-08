import { describe, expect, it } from "bun:test";
import { decorateTitle, servedPathname } from "./seo";

describe("decorateTitle", () => {
  it("appends the wordmark to a page's own title", () => {
    expect(decorateTitle("CLI reference")).toBe("CLI reference - gramdown");
  });

  it("uses the tagline site title when the page passes none (the index)", () => {
    expect(decorateTitle(undefined)).toBe("gramdown - Convert Grammarly .docx exports to Markdown");
  });

  it("treats an empty string like a missing title", () => {
    expect(decorateTitle("")).toBe("gramdown - Convert Grammarly .docx exports to Markdown");
  });
});

describe("servedPathname", () => {
  it("strips a trailing .html", () => {
    expect(servedPathname("/docs/cli.html")).toBe("/docs/cli");
  });

  it("reduces /index.html to the directory root", () => {
    expect(servedPathname("/index.html")).toBe("/");
    expect(servedPathname("/docs/index.html")).toBe("/docs/");
  });

  it("leaves an already-clean path untouched", () => {
    expect(servedPathname("/terms")).toBe("/terms");
    expect(servedPathname("/")).toBe("/");
  });
});
