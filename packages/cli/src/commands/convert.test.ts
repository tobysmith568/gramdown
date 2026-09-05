import { readFixture, fixturePath as sharedFixturePath } from "@gramdown/fixtures";
import { describe, expect, it } from "bun:test";
import type { ConvertOptions } from "../args/schema";
import { fakeIo } from "../test-helpers";
import { runConvert } from "./convert";
const fixturePath = sharedFixturePath("headings");
const fixtureBytes = await readFixture("headings");

const options = (overrides: Partial<ConvertOptions> = {}): ConvertOptions => ({
  input: fixturePath,
  output: undefined,
  guessLang: false,
  ...overrides
});

describe("runConvert", () => {
  it("writes Markdown to stdout by default", async () => {
    const io = fakeIo({ [fixturePath]: fixtureBytes });
    const opts = options();

    const code = await runConvert(opts, io);
    const stdout = io.out();

    expect(code).toBe(0);
    expect(stdout).toContain("# ");
    expect(io.written.size).toBe(0);
  });

  it("writes to the output file when -o is given", async () => {
    const io = fakeIo({ [fixturePath]: fixtureBytes });
    const opts = options({ output: "out.md" });

    const code = await runConvert(opts, io);
    const stdout = io.out();
    const written = io.written.get("out.md");

    expect(code).toBe(0);
    expect(stdout).toBe("");
    expect(written).toContain("# ");
  });

  it("reports a missing file cleanly", async () => {
    const io = fakeIo();
    const opts = options({ input: "does-not-exist.docx" });

    const code = await runConvert(opts, io);
    const stderr = io.err();

    expect(code).toBe(1);
    expect(stderr).toMatch(/no such file/);
  });

  it("reports an unreadable .docx cleanly", async () => {
    const encoder = new TextEncoder();
    const junk = encoder.encode("not a zip archive");
    const io = fakeIo({ "junk.docx": junk });
    const opts = options({ input: "junk.docx" });

    const code = await runConvert(opts, io);
    const stderr = io.err();

    expect(code).toBe(1);
    expect(stderr).toMatch(/error: junk\.docx:/);
  });
});
