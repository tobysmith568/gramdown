import JSZip from "jszip";
import { paragraphStyles, preprocessDocumentXml } from "./document";
import { ensureStyles } from "./style";

const documentPath = "word/document.xml";
const stylesPath = "word/styles.xml";

const emptyStylesXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  "</w:styles>";

/** Rewrite a zip's `word/document.xml` in place, expressing its code as styles. */
const rewriteDocumentXml = async (zip: JSZip, documentFile: JSZip.JSZipObject): Promise<void> => {
  const documentXml = await documentFile.async("string");
  const preprocessedDocumentXml = preprocessDocumentXml(documentXml);

  zip.file(documentPath, preprocessedDocumentXml);
};

/** Rewrite a zip's `word/styles.xml` in place, creating it first if it's missing. */
const rewriteStylesXml = async (zip: JSZip): Promise<void> => {
  const stylesFile = zip.file(stylesPath);
  const stylesXml = stylesFile ? await stylesFile.async("string") : emptyStylesXml;
  const updatedStylesXml = ensureStyles(stylesXml, paragraphStyles);

  zip.file(stylesPath, updatedStylesXml);
};

/**
 * Rewrite a `.docx` in memory so its code is expressed as styles.
 *
 * Returns the original bytes untouched if the archive does not look like a Word
 * document (no `word/document.xml`); a missing `word/styles.xml` is created.
 */
export const preprocessDocx = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const zip = await JSZip.loadAsync(bytes);

  const documentFile = zip.file(documentPath);
  if (!documentFile) {
    return bytes;
  }

  await rewriteDocumentXml(zip, documentFile);
  await rewriteStylesXml(zip);

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
};
