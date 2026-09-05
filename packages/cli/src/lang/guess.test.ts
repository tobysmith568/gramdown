import { describe, expect, it } from "bun:test";
import { languageGuesser } from "./guess";

describe("languageGuesser", () => {
  it("labels a shell script", () => {
    const language = languageGuesser('#!/bin/bash\nset -euo pipefail\necho "$HOME"\n');

    expect(language).toBe("bash");
  });

  it("labels TypeScript", () => {
    const language = languageGuesser("const x: number = 1;\nfunction f(a: string): void {}\n");

    expect(language).toBe("typescript");
  });

  it("returns a lowercase fence identifier", () => {
    const language = languageGuesser("SELECT id FROM users WHERE id = 1;");

    const lowercased = language?.toLowerCase();

    expect(language).toBe(lowercased);
  });

  it("gives no label to an empty block", () => {
    const language = languageGuesser("");

    expect(language).toBeUndefined();
  });

  it("gives no label to a whitespace-only block", () => {
    const language = languageGuesser("   \n  ");

    expect(language).toBeUndefined();
  });

  it("gives no label when nothing scores", () => {
    const language = languageGuesser("the quick brown fox");

    expect(language).toBeUndefined();
  });
});
