import { describe, expect, it } from "bun:test";
import type { ConvertResponse, ConvertZipResponse } from "./messages";
import { readConvertResult, readZipBytes } from "./response";

const convertReply = (over: Partial<ConvertResponse> = {}): ConvertResponse => ({
  kind: "convert",
  id: 0,
  ok: true,
  markdown: "# hi\n",
  error: null,
  warnings: [],
  ...over
});

const zipReply = (over: Partial<ConvertZipResponse> = {}): ConvertZipResponse => ({
  kind: "zip",
  id: 0,
  ok: true,
  bytes: new Uint8Array([1, 2]),
  error: null,
  ...over
});

describe("readConvertResult", () => {
  it("returns the markdown and warnings on success", () => {
    const result = readConvertResult(convertReply({ warnings: ["heads up"] }));

    expect(result).toEqual({ markdown: "# hi\n", warnings: ["heads up"] });
  });

  it("throws the worker's error message on failure", () => {
    const reply = convertReply({ ok: false, markdown: null, error: "bad docx" });

    expect(() => readConvertResult(reply)).toThrow("bad docx");
  });

  it("throws a generic message when the worker reports failure with no detail", () => {
    const reply = convertReply({ ok: false, markdown: null, error: null });

    expect(() => readConvertResult(reply)).toThrow("unknown reason");
  });

  it("rejects a reply of the wrong kind", () => {
    expect(() => readConvertResult(zipReply())).toThrow("wrong message kind");
  });
});

describe("readZipBytes", () => {
  it("returns the archive bytes on success", () => {
    expect(Array.from(readZipBytes(zipReply()))).toEqual([1, 2]);
  });

  it("throws the worker's error on failure", () => {
    expect(() => readZipBytes(zipReply({ ok: false, bytes: null, error: "no space" }))).toThrow(
      "no space"
    );
  });

  it("rejects a reply of the wrong kind", () => {
    expect(() => readZipBytes(convertReply())).toThrow("wrong message kind");
  });
});
