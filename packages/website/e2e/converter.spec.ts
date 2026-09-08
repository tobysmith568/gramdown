import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { IndexPageObject } from "./page-objects/index.po";

const coreSnapshot = (name: string): Promise<string> => {
  const url = new URL(`../../core/test/fixtures/${name}.md`, import.meta.url);
  return readFile(fileURLToPath(url), "utf8");
};

test.describe("Browser converter", () => {
  test("converts a dropped .docx and hands back Markdown identical to the core snapshot", async ({
    page
  }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await index.converter.convertFixtures("headings");
    await index.converter.waitForReady("headings.md");

    await expect(index.converter.paneFilename).toHaveText("headings.md");

    const downloadPromise = page.waitForEvent("download");
    await index.converter.paneDownloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("headings.md");
    const saved = await readFile(await download.path(), "utf8");
    expect(saved).toBe(await coreSnapshot("headings"));
  });

  test("announces the result to assistive tech", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await index.converter.convertFixtures("headings");
    await index.converter.waitForReady("headings.md");

    await expect(index.converter.liveRegion).toContainText("headings.md ready");
  });

  test("skips a non-.docx file with a note and no row", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await index.converter.fileInput.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a docx")
    });

    await expect(index.converter.rejectionNote).toBeVisible();
    await expect(index.converter.rowByName("notes.md")).toHaveCount(0);
  });

  test("keeps a converted file across navigation and a reload", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await index.converter.convertFixtures("headings");
    await index.converter.waitForReady("headings.md");
    await index.converter.waitForPersisted("headings.md");

    await index.chrome.headerLink("Docs").click();
    await expect(page).toHaveURL("/docs");

    await page.goBack();
    await expect(page).toHaveURL("/");
    await index.converter.waitForHydration();
    await expect(index.converter.rowByName("headings.md")).toBeVisible();

    await page.reload();
    await index.converter.waitForHydration();
    await expect(index.converter.rowByName("headings.md")).toBeVisible();
  });

  test("removes a file from the panel", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await index.converter.convertFixtures("headings");
    await index.converter.waitForReady("headings.md");

    await index.converter
      .rowByName("headings.md")
      .getByRole("button", { name: "Remove headings.md" })
      .click();

    await expect(index.converter.rowByName("headings.md")).toHaveCount(0);
    // The worked example is always present.
    await expect(index.converter.sampleRow).toBeVisible();
  });

  test("de-duplicates the output name when the same file is converted twice", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await index.converter.convertFixtures("headings");
    await index.converter.waitForReady("headings.md");
    await index.converter.convertFixtures("headings");
    await index.converter.waitForReady("headings-2.md");

    await expect(index.converter.rowByName("headings.md")).toBeVisible();
    await expect(index.converter.rowByName("headings-2.md")).toBeVisible();
  });

  test("re-runs converted files when the guess-languages toggle changes", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    // Default-on: code fences come back labelled.
    await index.converter.convertFixtures("code");
    await index.converter.waitForReady("code.md");
    await expect(index.converter.guessLanguagesCheckbox).toBeChecked();
    await expect(index.converter.panel).toContainText("javascript");

    // Turning it off re-converts every ready file in place from its retained bytes.
    await index.converter.guessLanguagesCheckbox.uncheck();
    await expect(index.converter.panel).not.toContainText("javascript");
  });

  test("offers a zip once two files are ready", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();
    await index.converter.waitForHydration();

    await expect(index.converter.downloadAllButton).toHaveCount(0);

    await index.converter.convertFixtures("headings", "lists");
    await index.converter.waitForReady("headings.md");
    await index.converter.waitForReady("lists.md");

    await expect(index.converter.downloadAllButton).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await index.converter.downloadAllButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("gramdown-markdown.zip");
  });
});
