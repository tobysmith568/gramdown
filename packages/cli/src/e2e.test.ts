import { convert } from "@gramdown/core";
import { fixturePath, readFixture } from "@gramdown/fixtures";
import { describe, expect, it } from "bun:test";
import { run } from "./main";
import { fakeIo } from "./test-helpers";

// End-to-end: a real `.docx` all the way through `run()`. These check the CLI
// layer specifically — that it pipes bytes to core and core's string back out
// without mangling it — so they assert against `convert()`'s behaviour, not
// against core's committed snapshots (which move when `test:update` runs).

describe("run (end to end)", () => {
  it("writes exactly what convert() produces", async () => {
    const path = fixturePath("code");
    const bytes = await readFixture("code");
    const expected = await convert(bytes);
    const io = fakeIo({ [path]: bytes });

    const code = await run(["bun", "gramdown", path], io);
    const stdout = io.out();

    expect(code).toBe(0);
    expect(stdout).toBe(expected);
  });

  it("writes that same Markdown to -o instead of stdout", async () => {
    const path = fixturePath("headings");
    const bytes = await readFixture("headings");
    const expected = await convert(bytes);
    const io = fakeIo({ [path]: bytes });

    const code = await run(["bun", "gramdown", path, "-o", "out.md"], io);
    const stdout = io.out();
    const written = io.written.get("out.md");

    expect(code).toBe(0);
    expect(stdout).toBe("");
    expect(written).toBe(expected);
  });

  it("labels code fences when --guess-lang is passed", async () => {
    const path = fixturePath("code");
    const bytes = await readFixture("code");
    const io = fakeIo({ [path]: bytes });

    const code = await run(["bun", "gramdown", path, "--guess-lang"], io);
    const stdout = io.out();
    const labelledFence = /^```[a-z]+$/m.test(stdout);

    expect(code).toBe(0);
    expect(labelledFence).toBe(true);
  });
});
