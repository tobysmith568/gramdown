import { describe, expect, it } from "bun:test";
import { installCommand } from "./installCommands";

describe("installCommand", () => {
  it("pairs every method with a non-empty install line and the same demo run line", () => {
    for (const [install, run] of Object.values(installCommand)) {
      expect(install.length).toBeGreaterThan(0);
      expect(run).toBe("gramdown draft.docx -o draft.md");
    }
  });

  it("installs gramdown itself, not some other package", () => {
    expect(installCommand.npm[0]).toContain("gramdown");
    expect(installCommand.brew[0]).toContain("gramdown");
    expect(installCommand.shell[0]).toContain("install.sh");
  });

  it("points the Homebrew command at the actual tap", () => {
    expect(installCommand.brew[0]).toBe("brew install tobysmith568/tap/gramdown");
  });

  it("has no entry for the standalone binary - it isn't a one-liner", () => {
    expect(Object.keys(installCommand)).not.toContain("binary");
  });
});
