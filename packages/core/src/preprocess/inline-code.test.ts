import { describe, expect, it } from "bun:test";
import { styleInlineCode } from "./inline-code";
import { body, line, paragraph, run } from "./test-helpers";

const inlineCodeRuns = (xml: string) =>
  (xml.match(/<w:rStyle w:val="VerbatimChar"\/>/g) ?? []).length;

describe("styleInlineCode", () => {
  it("styles a monospace run inside prose as inline code", () => {
    const callRun = run("Call ");
    const codeRun = run("readFile", true);
    const restRun = run(" first.");
    const prosePara = paragraph(callRun, codeRun, restRun);
    const xml = body(prosePara);

    const result = styleInlineCode(xml);
    const codeRunCount = inlineCodeRuns(result);

    expect(codeRunCount).toBe(1);
  });

  it("leaves an all-monospace paragraph alone — that's a code block, not inline code", () => {
    const codePara = line("const x = 1;", true);
    const xml = body(codePara);

    const result = styleInlineCode(xml);
    const codeRunCount = inlineCodeRuns(result);

    expect(codeRunCount).toBe(0);
  });

  it("leaves a plain prose paragraph alone", () => {
    const prosePara = line("Just some prose.");
    const xml = body(prosePara);

    const result = styleInlineCode(xml);

    expect(result).toBe(xml);
  });

  it("is idempotent", () => {
    const callRun = run("Call ");
    const codeRun = run("x", true);
    const prosePara = paragraph(callRun, codeRun);
    const xml = body(prosePara);

    const once = styleInlineCode(xml);
    const twice = styleInlineCode(once);

    expect(twice).toBe(once);
  });
});
