import { describe, expect, it } from "bun:test";
import { countLines, dimMarkdown, escapeHtml } from "./dim-markdown";

describe("escapeHtml", () => {
  it("escapes the three markup-significant characters", () => {
    expect(escapeHtml('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d "e"');
  });

  it("escapes ampersands before angle brackets so entities aren't double-escaped", () => {
    expect(escapeHtml("<tag>")).toBe("&lt;tag&gt;");
  });
});

describe("countLines", () => {
  it("counts every line", () => {
    expect(countLines("a\nb\nc")).toBe(3);
  });

  it("ignores a single trailing newline", () => {
    expect(countLines("a\nb\n")).toBe(2);
  });

  it("counts a blank line between content", () => {
    expect(countLines("a\n\nb")).toBe(3);
  });

  it("treats the empty string as one line", () => {
    expect(countLines("")).toBe(1);
  });
});

describe("dimMarkdown", () => {
  it("returns one entry per source line", () => {
    expect(dimMarkdown("one\ntwo\nthree")).toHaveLength(3);
  });

  it("drops a single trailing newline before splitting", () => {
    expect(dimMarkdown("one\ntwo\n")).toHaveLength(2);
  });

  it("wraps a heading marker in a .mk span, leaving the text bare", () => {
    const [line] = dimMarkdown("## Title");

    expect(line).toBe('<span class="mk">## </span>Title');
  });

  it("wraps bullet and ordered-list markers", () => {
    expect(dimMarkdown("- item")[0]).toBe('<span class="mk">- </span>item');
    expect(dimMarkdown("1. item")[0]).toBe('<span class="mk">1. </span>item');
  });

  it("wraps a blockquote marker, angle bracket escaped", () => {
    expect(dimMarkdown("> quoted")[0]).toBe('<span class="mk">&gt; </span>quoted');
  });

  it("wraps bold markers and inline code backticks", () => {
    expect(dimMarkdown("a **b** c")[0]).toBe(
      'a <span class="mk">**</span>b<span class="mk">**</span> c'
    );
    expect(dimMarkdown("run `npm i` now")[0]).toBe(
      'run <span class="mk">`</span>npm i<span class="mk">`</span> now'
    );
  });

  it("wraps link punctuation but keeps the text and href", () => {
    expect(dimMarkdown("see [docs](/docs)")[0]).toBe(
      'see <span class="mk">[</span>docs<span class="mk">](</span>/docs<span class="mk">)</span>'
    );
  });

  it("leaves the contents of a fenced code block undimmed", () => {
    const lines = dimMarkdown("```js\nconst x = 1; // **not bold**\n```");

    expect(lines[0]).toBe('<span class="mk">```js</span>');
    expect(lines[1]).toBe("const x = 1; // **not bold**");
    expect(lines[2]).toBe('<span class="mk">```</span>');
  });

  it("resumes dimming after the closing fence", () => {
    const lines = dimMarkdown("```\ncode\n```\n**after**");

    expect(lines[3]).toBe('<span class="mk">**</span>after<span class="mk">**</span>');
  });

  it("renders an empty line as a non-breaking space so the row keeps height", () => {
    expect(dimMarkdown("a\n\nb")[1]).toBe("&nbsp;");
  });

  it("escapes HTML in prose before dimming", () => {
    expect(dimMarkdown("a <script> tag")[0]).toBe("a &lt;script&gt; tag");
  });
});
