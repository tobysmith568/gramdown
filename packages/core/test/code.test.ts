import { describe, expect, it } from "bun:test";
import { convertFixture } from "./helpers.js";

describe("code.docx", () => {
  it("marks a monospace run inside prose as inline code", async () => {
    const markdown = await convertFixture("code");
    expect(markdown).toContain("This has `inline code` words.");
  });

  it("fences an all-monospace paragraph even when its text isn't code", async () => {
    // Grammarly has no way to record "this is a code block" beyond the font,
    // so any Courier New paragraph becomes a fenced block — see docs/plan.md.
    const markdown = await convertFixture("code");
    expect(markdown).toContain("```\nThis is plain text in a code block.\n```");
  });

  it("fences a multi-line block and preserves its indentation", async () => {
    const markdown = await convertFixture("code");

    expect(markdown).toContain(
      "```\n" +
        "export const joinWords = (words) => {\n" +
        '  const joinedWords = words.join("");\n' +
        "  return joinedWords;\n" +
        "}\n" +
        "```"
    );
  });

  it("converts Grammarly's non-breaking-space indentation to real spaces", async () => {
    const markdown = await convertFixture("code");

    expect(markdown).not.toContain(" ");
    expect(markdown).toContain('  const joinedWords = words.join("");');
  });

  it("fences a second, differently-indented block the same way", async () => {
    const markdown = await convertFixture("code");

    expect(markdown).toContain(
      "```\n" +
        "public static string JoinWords(IEnumerable<string> words)\n" +
        "{\n" +
        '    var joinedWords = string.Join("", words);\n' +
        "    return joinedWords;\n" +
        "}\n" +
        "```"
    );
  });

  it("keeps two code paragraphs with no blank line between them as separate blocks", async () => {
    // These have no blank line, no prose, nothing between them at all — so a
    // naive "merge every adjacent code paragraph" rule would fuse them into one
    // two-line block. Grammarly's own paragraph spacing (100 twips on the side
    // facing a continuation, 200 on the side facing a boundary) is what tells
    // startsNewCodeBlock (preprocess.ts) these are two separate one-line blocks.
    const markdown = await convertFixture("code");

    expect(markdown).toContain(
      "```\n// This is code block one\n```\n\n```\n// This is code block two\n```"
    );
  });

  it("counts exactly five fenced blocks", async () => {
    const markdown = await convertFixture("code");
    const fences = markdown.match(/^```/gm) ?? [];
    expect(fences).toHaveLength(10); // 5 blocks x open + close
  });
});
