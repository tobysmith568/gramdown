import { describe, expect, it } from "bun:test";
import { convert } from "./core.js";

describe("convert", () => {
  it("is exported as a function", () => {
    expect(typeof convert).toBe("function");
  });

  it("rejects until implemented", async () => {
    await expect(convert(new Uint8Array())).rejects.toThrow(/not implemented/);
  });
});
