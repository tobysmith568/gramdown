import { describe, expect, it } from "bun:test";
import { hasText, paragraphProperties, readBoolean, runProperties, runs, textOf } from "./xml";

const run = (properties: string, text: string) => `<w:r>${properties}<w:t>${text}</w:t></w:r>`;

describe("runs", () => {
  it("finds every run in a paragraph", () => {
    const paragraph = `<w:p>${run("", "one")}${run("", "two")}</w:p>`;
    expect(runs(paragraph)).toHaveLength(2);
  });

  it("finds self-closing runs", () => {
    expect(runs('<w:p><w:r w:rsidR="00" /></w:p>')).toEqual(['<w:r w:rsidR="00" />']);
  });

  it("returns nothing for a paragraph with no runs", () => {
    expect(runs("<w:p><w:pPr /></w:p>")).toEqual([]);
  });
});

describe("hasText", () => {
  it("is true for a run carrying text", () => {
    expect(hasText(run("", "hello"))).toBe(true);
  });

  it("is false for a run carrying only a break", () => {
    expect(hasText("<w:r><w:br /></w:r>")).toBe(false);
  });
});

describe("textOf", () => {
  it("joins every text node", () => {
    expect(textOf(`<w:p>${run("", "one ")}${run("", "two")}</w:p>`)).toBe("one two");
  });

  it("keeps text marked with xml:space", () => {
    expect(textOf('<w:p><w:r><w:t xml:space="preserve">  x</w:t></w:r></w:p>')).toBe("  x");
  });

  it("is empty for a paragraph with no text", () => {
    expect(textOf("<w:p />")).toBe("");
  });
});

describe("runProperties", () => {
  it("returns only the properties block", () => {
    const properties = '<w:rPr><w:rFonts w:ascii="Courier New" /></w:rPr>';
    expect(runProperties(run(properties, "code"))).toBe(properties);
  });

  it("does not mistake text content for properties", () => {
    expect(runProperties(run("", "I like Courier New"))).toBe("");
  });

  it("handles a self-closing properties block", () => {
    expect(runProperties(run("<w:rPr />", "x"))).toBe("<w:rPr />");
  });
});

describe("paragraphProperties", () => {
  it("returns only the paragraph's own properties", () => {
    const paragraph = `<w:p><w:pPr><w:ind w:left="600" /></w:pPr>${run("<w:rPr />", "x")}</w:p>`;
    expect(paragraphProperties(paragraph)).toBe('<w:pPr><w:ind w:left="600" /></w:pPr>');
  });

  it("is empty when there are none", () => {
    expect(paragraphProperties("<w:p />")).toBe("");
  });
});

describe("readBoolean", () => {
  it("is true for a bare flag with no w:val", () => {
    expect(readBoolean("<w:checked/>", "checked")).toBe(true);
  });

  it('is true for w:val="1"', () => {
    expect(readBoolean('<w:checked w:val="1"/>', "checked")).toBe(true);
  });

  it('is false for w:val="0"', () => {
    expect(readBoolean('<w:checked w:val="0"/>', "checked")).toBe(false);
  });

  it('is false for w:val="false", case-insensitively', () => {
    expect(readBoolean('<w:checked w:val="FALSE"/>', "checked")).toBe(false);
  });

  it("is undefined when the tag isn't present at all", () => {
    expect(readBoolean("<w:other/>", "checked")).toBeUndefined();
  });
});
