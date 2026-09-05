import { describe, expect, it } from "bun:test";
import { UsageError } from "../errors";
import { parseCliArgs } from "./parse";

const argv = (...args: string[]): string[] => ["bun", "gramdown", ...args];

describe("parseCliArgs", () => {
  it("treats no args as an implicit help request", () => {
    const args = argv();

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({ kind: "help", explicit: false });
  });

  it("treats --help as an explicit help request", () => {
    const args = argv("--help");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({ kind: "help", explicit: true });
  });

  it("treats -h as an explicit help request", () => {
    const args = argv("-h");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({ kind: "help", explicit: true });
  });

  it("recognises --version", () => {
    const args = argv("--version");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({ kind: "version" });
  });

  it("recognises -v", () => {
    const args = argv("-v");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({ kind: "version" });
  });

  it("resolves a bare input path to a convert invocation", () => {
    const args = argv("draft.docx");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({
      kind: "convert",
      options: { input: "draft.docx", output: undefined, guessLang: false }
    });
  });

  it("reads the spaced -o form and --guess-lang", () => {
    const args = argv("draft.docx", "-o", "out.md", "--guess-lang");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({
      kind: "convert",
      options: { input: "draft.docx", output: "out.md", guessLang: true }
    });
  });

  it("reads the --output=value form", () => {
    const args = argv("--output=out.md", "draft.docx");

    const invocation = parseCliArgs(args);

    expect(invocation).toEqual({
      kind: "convert",
      options: { input: "draft.docx", output: "out.md", guessLang: false }
    });
  });

  it("rejects a non-docx input", () => {
    const args = argv("notes.txt");

    expect(() => parseCliArgs(args)).toThrow(UsageError);

    expect(() => parseCliArgs(args)).toThrow(/\.docx/);
  });

  it("rejects a missing input", () => {
    const args = argv("--guess-lang");

    expect(() => parseCliArgs(args)).toThrow(/no input/);
  });

  it("rejects unknown flags", () => {
    const args = argv("draft.docx", "--frobnicate");

    expect(() => parseCliArgs(args)).toThrow(UsageError);
  });

  it("rejects -o with no value", () => {
    const args = argv("draft.docx", "-o");

    expect(() => parseCliArgs(args)).toThrow(UsageError);
  });

  it("rejects a second positional", () => {
    const args = argv("a.docx", "b.docx");

    expect(() => parseCliArgs(args)).toThrow(/extra argument/);
  });
});
