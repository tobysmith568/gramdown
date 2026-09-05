import { describe, expect, it } from "bun:test";
import { hasText, paragraphProperties, readBoolean, runProperties, runs, textOf } from "./xml";

const run = (properties: string, text: string) => `<w:r>${properties}<w:t>${text}</w:t></w:r>`;

describe("runs", () => {
  it("finds every run in a paragraph", () => {
    const first = run("", "one");
    const second = run("", "two");
    const paragraph = `<w:p>${first}${second}</w:p>`;

    const found = runs(paragraph);

    expect(found).toHaveLength(2);
  });

  it("finds self-closing runs", () => {
    const found = runs('<w:p><w:r w:rsidR="00" /></w:p>');

    expect(found).toEqual(['<w:r w:rsidR="00" />']);
  });

  it("returns nothing for a paragraph with no runs", () => {
    const found = runs("<w:p><w:pPr /></w:p>");

    expect(found).toEqual([]);
  });
});

describe("hasText", () => {
  it("is true for a run carrying text", () => {
    const textRun = run("", "hello");

    const result = hasText(textRun);

    expect(result).toBe(true);
  });

  it("is false for a run carrying only a break", () => {
    const result = hasText("<w:r><w:br /></w:r>");

    expect(result).toBe(false);
  });
});

describe("textOf", () => {
  it("joins every text node", () => {
    const first = run("", "one ");
    const second = run("", "two");
    const paragraph = `<w:p>${first}${second}</w:p>`;

    const text = textOf(paragraph);

    expect(text).toBe("one two");
  });

  it("keeps text marked with xml:space", () => {
    const text = textOf('<w:p><w:r><w:t xml:space="preserve">  x</w:t></w:r></w:p>');

    expect(text).toBe("  x");
  });

  it("is empty for a paragraph with no text", () => {
    const text = textOf("<w:p />");

    expect(text).toBe("");
  });
});

describe("runProperties", () => {
  it("returns only the properties block", () => {
    const properties = '<w:rPr><w:rFonts w:ascii="Courier New" /></w:rPr>';
    const codeRun = run(properties, "code");

    const result = runProperties(codeRun);

    expect(result).toBe(properties);
  });

  it("does not mistake text content for properties", () => {
    const proseRun = run("", "I like Courier New");

    const result = runProperties(proseRun);

    expect(result).toBe("");
  });

  it("handles a self-closing properties block", () => {
    const selfClosing = run("<w:rPr />", "x");

    const result = runProperties(selfClosing);

    expect(result).toBe("<w:rPr />");
  });
});

describe("paragraphProperties", () => {
  it("returns only the paragraph's own properties", () => {
    const textRun = run("<w:rPr />", "x");
    const paragraph = `<w:p><w:pPr><w:ind w:left="600" /></w:pPr>${textRun}</w:p>`;

    const result = paragraphProperties(paragraph);

    expect(result).toBe('<w:pPr><w:ind w:left="600" /></w:pPr>');
  });

  it("is empty when there are none", () => {
    const result = paragraphProperties("<w:p />");

    expect(result).toBe("");
  });
});

describe("readBoolean", () => {
  it("is true for a bare flag with no w:val", () => {
    const result = readBoolean("<w:checked/>", "checked");

    expect(result).toBe(true);
  });

  it('is true for w:val="1"', () => {
    const result = readBoolean('<w:checked w:val="1"/>', "checked");

    expect(result).toBe(true);
  });

  it('is false for w:val="0"', () => {
    const result = readBoolean('<w:checked w:val="0"/>', "checked");

    expect(result).toBe(false);
  });

  it('is false for w:val="false", case-insensitively', () => {
    const result = readBoolean('<w:checked w:val="FALSE"/>', "checked");

    expect(result).toBe(false);
  });

  it("is undefined when the tag isn't present at all", () => {
    const result = readBoolean("<w:other/>", "checked");

    expect(result).toBeUndefined();
  });
});
