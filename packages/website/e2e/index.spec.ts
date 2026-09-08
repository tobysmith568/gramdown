import { expect, test } from "@playwright/test";
import { IndexPageObject } from "./page-objects/index.po";

test.describe("Index page", () => {
  test("has the site title and description", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();

    expect(await index.meta.title()).toBe("gramdown - Convert Grammarly .docx exports to Markdown");
    expect(await index.meta.description()).toContain("GitHub-flavored Markdown");
    expect(await index.meta.canonical()).toBe("https://gramdown.tobythe.dev/");
  });

  test("renders the hero", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();

    await expect(index.heading).toHaveText("Turn a Grammarly export into clean Markdown");
    await expect(index.installLines.first()).toHaveText("npm install -g gramdown");
    await expect(index.installLines).toHaveCount(2);
  });

  test("shows the site chrome", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();

    await expect(index.chrome.wordmark).toHaveText("gramdown");
    await expect(index.chrome.headerLink("Docs")).toBeVisible();
    await expect(index.chrome.footer).toContainText("Toby Smith");
  });

  test("shows the worked example in the converter panel before any file is dropped", async ({
    page
  }) => {
    const index = new IndexPageObject(page);
    await index.goto();

    await index.converter.waitForHydration();
    await expect(index.converter.sampleRow).toBeVisible();
    await expect(index.converter.paneFilename).toHaveText("sample.md");
    await expect(index.browserConverterHeading).toHaveText("Convert in your browser");
  });

  test("links out to the docs and both npm packages", async ({ page }) => {
    const index = new IndexPageObject(page);
    await index.goto();

    await expect(index.tailLink("Documentation")).toHaveAttribute("href", "/docs");
    await expect(index.tailLink("gramdown on npm")).toHaveAttribute(
      "href",
      "https://www.npmjs.com/package/gramdown"
    );
    await expect(index.tailLink("@gramdown/core on npm")).toHaveAttribute(
      "href",
      "https://www.npmjs.com/package/@gramdown/core"
    );
  });
});
