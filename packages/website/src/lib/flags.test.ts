import { describe, expect, it } from "bun:test";
import { coerceFlag } from "./flags";

describe("coerceFlag", () => {
  it("reads back a stored true / false", () => {
    expect(coerceFlag("true", false)).toBe(true);
    expect(coerceFlag("false", true)).toBe(false);
  });

  it("uses the fallback when nothing is stored", () => {
    expect(coerceFlag(null, true)).toBe(true);
    expect(coerceFlag(undefined, false)).toBe(false);
  });

  it("uses the fallback for an unrecognised value", () => {
    expect(coerceFlag("1", true)).toBe(true);
    expect(coerceFlag("yes", false)).toBe(false);
    expect(coerceFlag("", true)).toBe(true);
  });
});
