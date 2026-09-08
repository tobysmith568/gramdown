import { describe, expect, it } from "bun:test";
import { describeRejection, partitionDocxFiles } from "./dropped-files";

const file = (name: string): File => new File(["x"], name, { type: "application/octet-stream" });

describe("partitionDocxFiles", () => {
  it("keeps only the .docx files, in the original order", () => {
    const input = [file("a.docx"), file("b.pdf"), file("c.docx")];

    const { docx, rejectedCount } = partitionDocxFiles(input);

    expect(docx.map(f => f.name)).toEqual(["a.docx", "c.docx"]);
    expect(rejectedCount).toBe(1);
  });

  it("matches the extension case-insensitively", () => {
    const { docx, rejectedCount } = partitionDocxFiles([file("Report.DOCX")]);

    expect(docx).toHaveLength(1);
    expect(rejectedCount).toBe(0);
  });

  it("does not match a name that merely contains .docx", () => {
    const { docx, rejectedCount } = partitionDocxFiles([file("docx.txt"), file("a.docx.zip")]);

    expect(docx).toHaveLength(0);
    expect(rejectedCount).toBe(2);
  });

  it("reports nothing for an empty list", () => {
    expect(partitionDocxFiles([])).toEqual({ docx: [], rejectedCount: 0 });
  });
});

describe("describeRejection", () => {
  it("is null when nothing was skipped", () => {
    expect(describeRejection(0)).toBeNull();
  });

  it("uses the singular for one skipped file", () => {
    expect(describeRejection(1)).toBe("Skipped 1 file that isn’t a .docx.");
  });

  it("uses the plural for more than one", () => {
    expect(describeRejection(3)).toBe("Skipped 3 files that aren’t .docx.");
  });
});
