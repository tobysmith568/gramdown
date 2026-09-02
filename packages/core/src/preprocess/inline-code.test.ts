import { describe, expect, it } from "bun:test";
import { styleInlineCode } from "./inline-code";
import { body, paragraph, run } from "./test-helpers";

const inlineCodeRuns = (xml: string) =>
  (xml.match(/<w:rStyle w:val="VerbatimChar"\/>/g) ?? []).length;

describe("styleInlineCode", () => {
  it("styles a monospace run inside prose as inline code", () => {
    const result = styleInlineCode(
      body(paragraph(run("Call "), run("readFile", true), run(" first.")))
    );

    expect(inlineCodeRuns(result)).toBe(1);
  });

  it("leaves an all-monospace paragraph alone — that's a code block, not inline code", () => {
    const result = styleInlineCode(body(paragraph(run("const x = 1;", true))));
    expect(inlineCodeRuns(result)).toBe(0);
  });

  it("leaves a plain prose paragraph alone", () => {
    const xml = body(paragraph(run("Just some prose.")));
    expect(styleInlineCode(xml)).toBe(xml);
  });

  it("is idempotent", () => {
    const xml = body(paragraph(run("Call "), run("x", true)));
    const once = styleInlineCode(xml);
    expect(styleInlineCode(once)).toBe(once);
  });
});
