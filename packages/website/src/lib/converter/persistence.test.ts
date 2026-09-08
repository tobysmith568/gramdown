import { beforeEach, describe, expect, it } from "bun:test";
import "fake-indexeddb/auto";
import {
  applyRetention,
  clearStore,
  loadConversions,
  maxRecords,
  saveConversions
} from "./persistence";
import type { Conversion } from "./store";

const make = (overrides: Partial<Conversion> = {}): Conversion => ({
  id: crypto.randomUUID(),
  sourceName: "in.docx",
  outputName: "out.md",
  sizeBytes: 10,
  status: "ready",
  markdown: "# hi\n",
  warnings: [],
  error: null,
  sourceBytes: new Uint8Array([1, 2, 3]),
  langGuessed: false,
  createdAt: 0,
  ...overrides
});

describe("applyRetention", () => {
  it("keeps everything when under both caps", () => {
    const input = [make({ createdAt: 1 }), make({ createdAt: 2 })];

    expect(applyRetention(input)).toHaveLength(2);
  });

  it("evicts the oldest first once the record count cap is exceeded", () => {
    const input = Array.from({ length: maxRecords + 3 }, (_, i) =>
      make({ createdAt: i, outputName: `out-${i}.md` })
    );

    const kept = applyRetention(input);

    expect(kept).toHaveLength(maxRecords);
    expect(kept[0]?.outputName).toBe("out-3.md");
    expect(kept.at(-1)?.outputName).toBe(`out-${maxRecords + 2}.md`);
  });

  it("returns records oldest-first regardless of input order", () => {
    const input = [make({ createdAt: 30 }), make({ createdAt: 10 }), make({ createdAt: 20 })];

    expect(applyRetention(input).map(r => r.createdAt)).toEqual([10, 20, 30]);
  });

  it("evicts on the byte budget even when the count is fine", () => {
    const big = () =>
      make({ sourceBytes: new Uint8Array(20 * 1024 * 1024), markdown: "", createdAt: Date.now() });
    const input = [make({ createdAt: 1 }), big(), big()];

    const kept = applyRetention(input);

    expect(kept.length).toBeLessThan(3);
  });

  it("never evicts an in-flight (converting) record, even past the cap", () => {
    const converting = make({ status: "converting", createdAt: 0, outputName: "pending.md" });
    const finished = Array.from({ length: maxRecords + 5 }, (_, i) =>
      make({ createdAt: i + 1, outputName: `done-${i}.md` })
    );

    const kept = applyRetention([converting, ...finished]);

    expect(kept.some(r => r.outputName === "pending.md")).toBe(true);
    expect(kept).toHaveLength(maxRecords);
  });
});

describe("IndexedDB round-trip", () => {
  beforeEach(async () => {
    await clearStore();
  });

  it("returns an empty array when nothing has been saved", async () => {
    expect(await loadConversions()).toEqual([]);
  });

  it("saves and reloads a queue, preserving the source bytes", async () => {
    const original = [make({ outputName: "a.md" }), make({ outputName: "b.md" })];

    await saveConversions(original);
    const reloaded = await loadConversions();

    expect(reloaded.map(r => r.outputName)).toEqual(["a.md", "b.md"]);
    expect(reloaded[0]?.sourceBytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(reloaded[0]!.sourceBytes)).toEqual([1, 2, 3]);
  });

  it("applies the retention cap on save", async () => {
    const many = Array.from({ length: maxRecords + 4 }, (_, i) => make({ createdAt: i }));

    await saveConversions(many);

    expect(await loadConversions()).toHaveLength(maxRecords);
  });

  it("clearStore empties the store", async () => {
    await saveConversions([make()]);
    await clearStore();

    expect(await loadConversions()).toEqual([]);
  });
});
