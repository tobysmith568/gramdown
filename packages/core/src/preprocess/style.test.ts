import { describe, expect, it } from "bun:test";
import { ensureStyles, styleMapEntry, type StyleDescriptor } from "./style";

const paragraphStyle: StyleDescriptor = {
  id: "Example",
  name: "Example Style",
  type: "paragraph",
  htmlPath: "p:fresh"
};

const characterStyle: StyleDescriptor = {
  id: "ExampleChar",
  name: "Example Char",
  type: "character",
  htmlPath: "code"
};

describe("ensureStyles", () => {
  const empty = '<w:styles xmlns:w="urn:w"></w:styles>';

  it("declares every style it's given", () => {
    const result = ensureStyles(empty, [paragraphStyle, characterStyle]);
    expect(result).toContain('w:styleId="Example"');
    expect(result).toContain('w:styleId="ExampleChar"');
    expect(result).toEndWith("</w:styles>");
  });

  it("declares a paragraph style and a character style with the right w:type", () => {
    const result = ensureStyles(empty, [paragraphStyle, characterStyle]);
    expect(result).toContain('<w:style w:type="paragraph" w:styleId="Example">');
    expect(result).toContain('<w:style w:type="character" w:styleId="ExampleChar">');
  });

  it("does not redeclare a style that is already there", () => {
    const once = ensureStyles(empty, [paragraphStyle]);
    expect(ensureStyles(once, [paragraphStyle])).toBe(once);
  });

  it("leaves the input unchanged when there is nothing to add", () => {
    expect(ensureStyles(empty, [])).toBe(empty);
  });
});

describe("styleMapEntry", () => {
  it("maps a paragraph style with a p[] selector", () => {
    expect(styleMapEntry(paragraphStyle)).toBe("p[style-name='Example Style'] => p:fresh");
  });

  it("maps a character style with an r[] selector", () => {
    expect(styleMapEntry(characterStyle)).toBe("r[style-name='Example Char'] => code");
  });
});
