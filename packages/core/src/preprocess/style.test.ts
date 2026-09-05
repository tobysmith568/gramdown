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
    const twice = ensureStyles(once, [paragraphStyle]);

    expect(twice).toBe(once);
  });

  it("leaves the input unchanged when there is nothing to add", () => {
    const result = ensureStyles(empty, []);

    expect(result).toBe(empty);
  });
});

describe("styleMapEntry", () => {
  it("maps a paragraph style with a p[] selector", () => {
    const entry = styleMapEntry(paragraphStyle);

    expect(entry).toBe("p[style-name='Example Style'] => p:fresh");
  });

  it("maps a character style with an r[] selector", () => {
    const entry = styleMapEntry(characterStyle);

    expect(entry).toBe("r[style-name='Example Char'] => code");
  });
});
