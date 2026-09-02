import JSZip from "jszip";
import { PARAGRAPH_STYLES, preprocessDocumentXml } from "./document.js";
import { ensureStyles } from "./style.js";

const DOCUMENT_PATH = "word/document.xml";
const STYLES_PATH = "word/styles.xml";

/**
 * Rewrite a `.docx` in memory so its code is expressed as styles.
 *
 * Returns the original bytes untouched if the archive does not look like a Word
 * document (no `word/document.xml`); a missing `word/styles.xml` is created.
 */
export const preprocessDocx = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const zip = await JSZip.loadAsync(bytes);

  const documentFile = zip.file(DOCUMENT_PATH);
  if (!documentFile) return bytes;

  zip.file(DOCUMENT_PATH, preprocessDocumentXml(await documentFile.async("string")));

  const stylesFile = zip.file(STYLES_PATH);
  const stylesXml = stylesFile
    ? await stylesFile.async("string")
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "</w:styles>";
  zip.file(STYLES_PATH, ensureStyles(stylesXml, PARAGRAPH_STYLES));

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
};
