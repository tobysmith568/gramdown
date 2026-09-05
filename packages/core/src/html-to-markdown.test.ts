import { describe, expect, it } from "bun:test";
import { htmlToMarkdown } from "./html-to-markdown";

const md = (html: string, options?: Parameters<typeof htmlToMarkdown>[1]) =>
  htmlToMarkdown(html, options);

describe("code blocks", () => {
  it("fences a bare <pre>, which mammoth emits without a <code> child", () => {
    const markdown = md("<pre>const x = 1;</pre>");

    expect(markdown).toBe("```\nconst x = 1;\n```");
  });

  it("preserves indentation and blank lines", () => {
    const markdown = md("<pre>if (x) {\n\n  y();\n}</pre>");

    expect(markdown).toBe("```\nif (x) {\n\n  y();\n}\n```");
  });

  it("turns non-breaking-space indentation into real spaces", () => {
    const markdown = md("<pre>a();\n \u00a0b();</pre>");

    expect(markdown).toBe("```\na();\n  b();\n```");
  });

  it("lengthens the fence past any backticks in the code", () => {
    const markdown = md("<pre>echo ```x```</pre>");

    expect(markdown).toBe("````\necho ```x```\n````");
  });

  it("labels the fence when a language guesser is supplied", () => {
    const markdown = md("<pre>SELECT 1;</pre>", { guessLanguage: () => "sql" });

    expect(markdown).toBe("```sql\nSELECT 1;\n```");
  });

  it("leaves the fence unlabelled when the guesser declines", () => {
    const markdown = md("<pre>?</pre>", { guessLanguage: () => undefined });

    expect(markdown).toBe("```\n?\n```");
  });
});

describe("inline code", () => {
  it("wraps it in backticks", () => {
    const markdown = md("<p>Call <code>readFile</code> first.</p>");

    expect(markdown).toBe("Call `readFile` first.");
  });

  it("turns non-breaking spaces into real spaces", () => {
    const markdown = md("<p><code>a\u00a0b</code></p>");

    expect(markdown).toBe("`a b`");
  });

  it("lengthens the delimiter past any backticks in the code", () => {
    const markdown = md("<p><code>a`b</code></p>");

    expect(markdown).toBe("``a`b``");
  });

  it("pads code that starts or ends with a backtick", () => {
    const markdown = md("<p><code>`x</code></p>");

    expect(markdown).toBe("`` `x ``");
  });
});

describe("links", () => {
  it("strips Word's automatic underline from link text", () => {
    const markdown = md('<p><a href="https://example.com"><u>Example</u></a></p>');

    expect(markdown).toBe("[Example](https://example.com)");
  });

  it("keeps underline that is not the whole of the link text", () => {
    const markdown = md('<p><a href="https://example.com">An <u>Example</u></a></p>');

    expect(markdown).toContain("<u>");
  });

  it("keeps underline used deliberately in prose", () => {
    const markdown = md("<p>Really <u>very</u> important.</p>");

    expect(markdown).toBe("Really <u>very</u> important.");
  });
});

describe("other inline formatting", () => {
  it("writes strikethrough with double tildes", () => {
    const markdown = md("<p><s>gone</s></p>");

    expect(markdown).toBe("~~gone~~");
  });

  it("keeps subscript and superscript as inline HTML", () => {
    const subscript = md("<p>H<sub>2</sub>O</p>");
    const superscript = md("<p>x<sup>2</sup></p>");

    expect(subscript).toBe("H<sub>2</sub>O");
    expect(superscript).toBe("x<sup>2</sup>");
  });
});

describe("task lists", () => {
  it("writes an unchecked item", () => {
    const markdown = md('<ul><li><input type="checkbox">One</li></ul>');

    expect(markdown).toBe("- [ ] One");
  });

  it("writes a checked item", () => {
    const markdown = md('<ul><li><input type="checkbox" checked>One</li></ul>');

    expect(markdown).toBe("- [x] One");
  });

  it("indents a nested checklist item under its parent", () => {
    const html =
      '<ul><li><input type="checkbox">One' +
      '<ul><li><input type="checkbox" checked>Two</li></ul>' +
      "</li></ul>";

    const markdown = md(html);

    expect(markdown).toBe("- [ ] One\n  - [x] Two");
  });
});

describe("headings, lists and quotes", () => {
  it("writes ATX headings", () => {
    const markdown = md("<h2>Title</h2>");

    expect(markdown).toBe("## Title");
  });

  it("writes bullets with a single space", () => {
    const markdown = md("<ul><li>one</li><li>two</li></ul>");

    expect(markdown).toBe("- one\n- two");
  });

  it("numbers ordered lists from the start attribute", () => {
    const markdown = md('<ol start="3"><li>three</li><li>four</li></ol>');

    expect(markdown).toBe("3. three\n4. four");
  });

  it("indents a nested list under its parent item", () => {
    const markdown = md("<ul><li>one<ul><li>deeper</li></ul></li></ul>");

    expect(markdown).toBe("- one\n  - deeper");
  });

  it("writes block quotes", () => {
    const markdown = md("<blockquote><p>Wise words.</p></blockquote>");

    expect(markdown).toBe("> Wise words.");
  });

  it("does not wrap long paragraphs", () => {
    const words = "word ".repeat(40).trim();
    const sentence = `${words}.`;
    const html = `<p>${sentence}</p>`;

    const markdown = md(html);

    expect(markdown).toBe(sentence);
  });
});
