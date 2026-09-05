import { describe, expect, it } from "bun:test";
import { versionText } from "./help";
import { run } from "./main";
import { fakeIo } from "./test-helpers";

const argv = (...args: string[]): string[] => ["node", "gramdown", ...args];

describe("run", () => {
  it("prints usage and exits 1 with no args", async () => {
    const io = fakeIo();
    const args = argv();

    const code = await run(args, io);
    const stdout = io.out();
    const stderr = io.err();

    expect(code).toBe(1);
    expect(stdout).toMatch(/^gramdown <input\.docx>/);
    expect(stderr).toBe("");
  });

  it("prints usage to stdout and exits 0 for --help", async () => {
    const io = fakeIo();
    const args = argv("--help");

    const code = await run(args, io);
    const stdout = io.out();

    expect(code).toBe(0);
    expect(stdout).toMatch(/^gramdown <input\.docx>/);
  });

  it("prints the bare version for --version", async () => {
    const io = fakeIo();
    const args = argv("--version");

    const code = await run(args, io);
    const stdout = io.out();
    const expected = `${versionText()}\n`;

    expect(code).toBe(0);
    expect(stdout).toBe(expected);
  });

  it("prints the error and a usage reminder on a bad command line", async () => {
    const io = fakeIo();
    const args = argv("notes.txt");

    const code = await run(args, io);
    const stdout = io.out();
    const stderr = io.err();

    expect(code).toBe(1);
    expect(stderr).toMatch(/^error: .*\.docx/);
    expect(stderr).toContain("gramdown <input.docx>");
    expect(stdout).toBe("");
  });

  it("reports a missing input file", async () => {
    const io = fakeIo();
    const args = argv("does-not-exist.docx");

    const code = await run(args, io);
    const stderr = io.err();

    expect(code).toBe(1);
    expect(stderr).toMatch(/no such file/);
  });
});
