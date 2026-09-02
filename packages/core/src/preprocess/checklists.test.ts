import { describe, expect, it } from "bun:test";
import { checklistLevel, isChecked, isChecklistItem, styleChecklists } from "./checklists";
import { body, paragraph, run } from "./test-helpers";

const checkbox = (checked: boolean, checkedAttr = true) =>
  '<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:checkBox>' +
  '<w:default w:val="0" />' +
  (checkedAttr ? `<w:checked w:val="${checked ? "1" : "0"}" />` : "") +
  "</w:checkBox></w:ffData></w:fldChar></w:r>" +
  '<w:r><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r>' +
  '<w:r><w:fldChar w:fldCharType="end" /></w:r>';

const item = (left: number, checked: boolean, checkedAttr = true) =>
  `<w:p><w:pPr><w:ind w:left="${left}" /></w:pPr>${checkbox(checked, checkedAttr)}${run("Task")}</w:p>`;

describe("isChecklistItem", () => {
  it("recognises a paragraph carrying a FORMCHECKBOX field", () => {
    expect(isChecklistItem(item(720, false))).toBe(true);
  });

  it("does not mistake an ordinary paragraph for a checklist item", () => {
    expect(isChecklistItem(paragraph(run("Not a checklist.")))).toBe(false);
  });
});

describe("isChecked", () => {
  it("reads the checked state from <w:checked>", () => {
    expect(isChecked(item(720, true))).toBe(true);
    expect(isChecked(item(720, false))).toBe(false);
  });

  it("falls back to <w:default> when <w:checked> is absent", () => {
    const withoutChecked = item(720, false, false).replace(
      '<w:default w:val="0" />',
      '<w:default w:val="1" />'
    );
    expect(isChecked(withoutChecked)).toBe(true);
  });

  it("is false for a paragraph with no checkbox at all", () => {
    expect(isChecked(paragraph(run("Not a checklist.")))).toBe(false);
  });
});

describe("checklistLevel", () => {
  it("maps left indent to nesting level in 720-twip steps", () => {
    expect(checklistLevel(item(720, false))).toBe(0);
    expect(checklistLevel(item(1440, false))).toBe(1);
    expect(checklistLevel(item(2160, false))).toBe(2);
  });

  it("clamps an unindented checklist item to the top level", () => {
    expect(checklistLevel(paragraph(run("Task")))).toBe(0);
  });
});

describe("styleChecklists", () => {
  it("styles a checklist item with the style for its level, preserving the checkbox", () => {
    const result = styleChecklists(body(item(1440, true)));
    expect(result).toContain('<w:pStyle w:val="GrammarlyChecklist1"/>');
    expect(result).toContain("FORMCHECKBOX");
  });

  it("leaves an ordinary paragraph alone", () => {
    const xml = body(paragraph(run("Not a checklist.")));
    expect(styleChecklists(xml)).toBe(xml);
  });
});
