import { describe, expect, it } from "bun:test";
import JSZip from "jszip";
import { preprocessDocx } from "./docx";
import { body, line } from "./test-helpers";

const docx = async (files: Record<string, string>): Promise<Uint8Array> => {
  const zip = new JSZip();
  const entries = Object.entries(files);
  for (const [path, content] of entries) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: "uint8array" });
};

describe("preprocessDocx", () => {
  it("rewrites the document and the styles in place", async () => {
    const codePara = line("code();", true);
    const documentXml = body(codePara);
    const bytes = await docx({
      "word/document.xml": documentXml,
      "word/styles.xml": '<w:styles xmlns:w="urn:w"></w:styles>'
    });

    const processed = await preprocessDocx(bytes);
    const zip = await JSZip.loadAsync(processed);
    const documentEntry = zip.file("word/document.xml");
    const stylesEntry = zip.file("word/styles.xml");
    const rewrittenDocument = await documentEntry?.async("string");
    const rewrittenStyles = await stylesEntry?.async("string");

    expect(rewrittenDocument).toContain('<w:pStyle w:val="SourceCodeStart"/>');
    expect(rewrittenStyles).toContain('w:styleId="SourceCodeStart"');
  });

  it("creates word/styles.xml when the archive has none", async () => {
    const prosePara = line("x");
    const documentXml = body(prosePara);
    const bytes = await docx({ "word/document.xml": documentXml });

    const processed = await preprocessDocx(bytes);
    const zip = await JSZip.loadAsync(processed);
    const stylesEntry = zip.file("word/styles.xml");
    const styles = await stylesEntry?.async("string");

    expect(styles).toContain('w:styleId="VerbatimChar"');
  });

  it("returns a zip without word/document.xml untouched", async () => {
    const bytes = await docx({ "hello.txt": "not a word document" });

    const result = await preprocessDocx(bytes);

    expect(result).toBe(bytes);
  });
});
