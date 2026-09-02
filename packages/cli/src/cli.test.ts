import { describe, expect, it } from "bun:test";
import { run, usage } from "./cli.js";

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: { stdout: (s: string) => out.push(s), stderr: (s: string) => err.push(s) },
    out: () => out.join(""),
    err: () => err.join("")
  };
}

describe("run", () => {
  it("prints usage and exits 1 with no args", async () => {
    const c = capture();
    expect(await run(["bun", "cli"], c.io)).toBe(1);
    expect(c.out()).toBe(usage());
  });

  it("prints usage and exits 0 for --help", async () => {
    const c = capture();
    expect(await run(["bun", "cli", "--help"], c.io)).toBe(0);
  });

  it("rejects a non-docx path", async () => {
    const c = capture();
    expect(await run(["bun", "cli", "notes.txt"], c.io)).toBe(1);
    expect(c.err()).toMatch(/not a \.docx/);
  });
});
