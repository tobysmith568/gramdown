import { describe, expect, it } from "bun:test";
import JSZip from "jszip";
import { preprocessDocx } from "./docx.js";
import { body, paragraph, run } from "./test-helpers.js";

const docx = async (files: Record<string, string>): Promise<Uint8Array> => {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) zip.file(path, content);
  return zip.generateAsync({ type: "uint8array" });
};

describe("preprocessDocx", () => {
  it("rewrites the document and the styles in place", async () => {
    const bytes = await docx({
      "word/document.xml": body(paragraph(run("code();", true))),
      "word/styles.xml": '<w:styles xmlns:w="urn:w"></w:styles>'
    });

    const zip = await JSZip.loadAsync(await preprocessDocx(bytes));
    expect(await zip.file("word/document.xml")?.async("string")).toContain(
      '<w:pStyle w:val="SourceCodeStart"/>'
    );
    expect(await zip.file("word/styles.xml")?.async("string")).toContain(
      'w:styleId="SourceCodeStart"'
    );
  });

  it("creates word/styles.xml when the archive has none", async () => {
    const bytes = await docx({ "word/document.xml": body(paragraph(run("x"))) });
    const zip = await JSZip.loadAsync(await preprocessDocx(bytes));

    expect(await zip.file("word/styles.xml")?.async("string")).toContain(
      'w:styleId="VerbatimChar"'
    );
  });

  it("returns a zip without word/document.xml untouched", async () => {
    const bytes = await docx({ "hello.txt": "not a word document" });
    expect(await preprocessDocx(bytes)).toBe(bytes);
  });
});
