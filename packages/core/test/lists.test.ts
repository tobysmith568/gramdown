import { describe, expect, it } from "bun:test";
import { convertFixture } from "./helpers.js";

describe("lists.docx", () => {
  it("writes an ordered list numbered from 1, nesting sub-items under their parent", async () => {
    const markdown = await convertFixture("lists");

    expect(markdown).toContain(
      "\n1. One\n2. Two\n   1. Two, A\n      1. Two, A, i\n   2. Two, B\n3. Three\n"
    );
  });

  it("writes an unordered list with a dash, nesting sub-items under their parent", async () => {
    const markdown = await convertFixture("lists");

    expect(markdown).toContain(
      "\n- One\n- Two\n  - Two, A\n    - Two, A, i\n  - Two, B\n- Three\n"
    );
  });

  it("recovers Grammarly's checklist as a GFM task list, checked state and nesting intact", async () => {
    const markdown = await convertFixture("lists");

    expect(markdown).toContain(
      "\n- [ ] One\n- [ ] Two\n  - [x] Two, A\n    - [ ] Two, A, i\n  - [ ] Two, B\n- [x] Three\n"
    );
  });

  it("has no way to tell a collapsible list from a plain unordered one", async () => {
    // Known limitation: Grammarly's docx export gives a collapsible/toggle list
    // no formatting of its own, so it round-trips as an ordinary bullet list.
    const markdown = await convertFixture("lists");
    const afterCollapsible = markdown.split("The third list is a collapsible list:")[1];

    expect(afterCollapsible).toBeDefined();
    expect(afterCollapsible).toStartWith(
      "\n\n- One\n- Two\n  - Two, A\n    - Two, A, i\n  - Two, B\n- Three\n"
    );
  });
});
