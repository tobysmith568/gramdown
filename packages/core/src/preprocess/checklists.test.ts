import { describe, expect, it } from "bun:test";
import { checklistLevel, isChecked, isChecklistItem, styleChecklists } from "./checklists";
import { body, line, paragraph, run } from "./test-helpers";

const checkbox = (checked: boolean, checkedAttr = true) =>
  '<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:checkBox>' +
  '<w:default w:val="0" />' +
  (checkedAttr ? `<w:checked w:val="${checked ? "1" : "0"}" />` : "") +
  "</w:checkBox></w:ffData></w:fldChar></w:r>" +
  '<w:r><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r>' +
  '<w:r><w:fldChar w:fldCharType="end" /></w:r>';

const item = (left: number, checked: boolean, checkedAttr = true) => {
  const field = checkbox(checked, checkedAttr);
  const taskRun = run("Task");
  return `<w:p><w:pPr><w:ind w:left="${left}" /></w:pPr>${field}${taskRun}</w:p>`;
};

describe("isChecklistItem", () => {
  it("recognises a paragraph carrying a FORMCHECKBOX field", () => {
    const checklistItem = item(720, false);

    const result = isChecklistItem(checklistItem);

    expect(result).toBe(true);
  });

  it("does not mistake an ordinary paragraph for a checklist item", () => {
    const prosePara = line("Not a checklist.");

    const result = isChecklistItem(prosePara);

    expect(result).toBe(false);
  });
});

describe("isChecked", () => {
  it("reads the checked state from <w:checked>", () => {
    const checkedItem = item(720, true);
    const uncheckedItem = item(720, false);

    const checkedResult = isChecked(checkedItem);
    const uncheckedResult = isChecked(uncheckedItem);

    expect(checkedResult).toBe(true);
    expect(uncheckedResult).toBe(false);
  });

  it("falls back to <w:default> when <w:checked> is absent", () => {
    const base = item(720, false, false);
    const withoutChecked = base.replace('<w:default w:val="0" />', '<w:default w:val="1" />');

    const result = isChecked(withoutChecked);

    expect(result).toBe(true);
  });

  it("is false for a paragraph with no checkbox at all", () => {
    const prosePara = line("Not a checklist.");

    const result = isChecked(prosePara);

    expect(result).toBe(false);
  });
});

describe("checklistLevel", () => {
  it("maps left indent to nesting level in 720-twip steps", () => {
    const topItem = item(720, false);
    const nestedItem = item(1440, false);
    const deeperItem = item(2160, false);

    const topLevel = checklistLevel(topItem);
    const nestedLevel = checklistLevel(nestedItem);
    const deeperLevel = checklistLevel(deeperItem);

    expect(topLevel).toBe(0);
    expect(nestedLevel).toBe(1);
    expect(deeperLevel).toBe(2);
  });

  it("clamps an unindented checklist item to the top level", () => {
    const taskRun = run("Task");
    const unindented = paragraph(taskRun);

    const result = checklistLevel(unindented);

    expect(result).toBe(0);
  });
});

describe("styleChecklists", () => {
  it("styles a checklist item with the style for its level, preserving the checkbox", () => {
    const checklistItem = item(1440, true);
    const xml = body(checklistItem);

    const result = styleChecklists(xml);

    expect(result).toContain('<w:pStyle w:val="GrammarlyChecklist1"/>');
    expect(result).toContain("FORMCHECKBOX");
  });

  it("leaves an ordinary paragraph alone", () => {
    const prosePara = line("Not a checklist.");
    const xml = body(prosePara);

    const result = styleChecklists(xml);

    expect(result).toBe(xml);
  });
});
