import { describe, expect, it } from "bun:test";
import { htmlToMarkdown } from "./html-to-markdown";

const md = (html: string, options?: Parameters<typeof htmlToMarkdown>[1]) =>
  htmlToMarkdown(html, options);

describe("code blocks", () => {
  it("fences a bare <pre>, which mammoth emits without a <code> child", () => {
    expect(md("<pre>const x = 1;</pre>")).toBe("```\nconst x = 1;\n```");
  });

  it("preserves indentation and blank lines", () => {
    expect(md("<pre>if (x) {\n\n  y();\n}</pre>")).toBe("```\nif (x) {\n\n  y();\n}\n```");
  });

  it("turns non-breaking-space indentation into real spaces", () => {
    expect(md("<pre>a();\n \u00a0b();</pre>")).toBe("```\na();\n  b();\n```");
  });

  it("lengthens the fence past any backticks in the code", () => {
    expect(md("<pre>echo ```x```</pre>")).toBe("````\necho ```x```\n````");
  });

  it("labels the fence when a language guesser is supplied", () => {
    expect(md("<pre>SELECT 1;</pre>", { guessLanguage: () => "sql" })).toBe(
      "```sql\nSELECT 1;\n```"
    );
  });

  it("leaves the fence unlabelled when the guesser declines", () => {
    expect(md("<pre>?</pre>", { guessLanguage: () => undefined })).toBe("```\n?\n```");
  });
});

describe("inline code", () => {
  it("wraps it in backticks", () => {
    expect(md("<p>Call <code>readFile</code> first.</p>")).toBe("Call `readFile` first.");
  });

  it("turns non-breaking spaces into real spaces", () => {
    expect(md("<p><code>a\u00a0b</code></p>")).toBe("`a b`");
  });

  it("lengthens the delimiter past any backticks in the code", () => {
    expect(md("<p><code>a`b</code></p>")).toBe("``a`b``");
  });

  it("pads code that starts or ends with a backtick", () => {
    expect(md("<p><code>`x</code></p>")).toBe("`` `x ``");
  });
});

describe("links", () => {
  it("strips Word's automatic underline from link text", () => {
    expect(md('<p><a href="https://example.com"><u>Example</u></a></p>')).toBe(
      "[Example](https://example.com)"
    );
  });

  it("keeps underline that is not the whole of the link text", () => {
    expect(md('<p><a href="https://example.com">An <u>Example</u></a></p>')).toContain("<u>");
  });

  it("keeps underline used deliberately in prose", () => {
    expect(md("<p>Really <u>very</u> important.</p>")).toBe("Really <u>very</u> important.");
  });
});

describe("other inline formatting", () => {
  it("writes strikethrough with double tildes", () => {
    expect(md("<p><s>gone</s></p>")).toBe("~~gone~~");
  });

  it("keeps subscript and superscript as inline HTML", () => {
    expect(md("<p>H<sub>2</sub>O</p>")).toBe("H<sub>2</sub>O");
    expect(md("<p>x<sup>2</sup></p>")).toBe("x<sup>2</sup>");
  });
});

describe("task lists", () => {
  it("writes an unchecked item", () => {
    expect(md('<ul><li><input type="checkbox">One</li></ul>')).toBe("- [ ] One");
  });

  it("writes a checked item", () => {
    expect(md('<ul><li><input type="checkbox" checked>One</li></ul>')).toBe("- [x] One");
  });

  it("indents a nested checklist item under its parent", () => {
    const html =
      '<ul><li><input type="checkbox">One' +
      '<ul><li><input type="checkbox" checked>Two</li></ul>' +
      "</li></ul>";
    expect(md(html)).toBe("- [ ] One\n  - [x] Two");
  });
});

describe("headings, lists and quotes", () => {
  it("writes ATX headings", () => {
    expect(md("<h2>Title</h2>")).toBe("## Title");
  });

  it("writes bullets with a single space", () => {
    expect(md("<ul><li>one</li><li>two</li></ul>")).toBe("- one\n- two");
  });

  it("numbers ordered lists from the start attribute", () => {
    expect(md('<ol start="3"><li>three</li><li>four</li></ol>')).toBe("3. three\n4. four");
  });

  it("indents a nested list under its parent item", () => {
    expect(md("<ul><li>one<ul><li>deeper</li></ul></li></ul>")).toBe("- one\n  - deeper");
  });

  it("writes block quotes", () => {
    expect(md("<blockquote><p>Wise words.</p></blockquote>")).toBe("> Wise words.");
  });

  it("does not wrap long paragraphs", () => {
    const sentence = `${"word ".repeat(40).trim()}.`;
    expect(md(`<p>${sentence}</p>`)).toBe(sentence);
  });
});
