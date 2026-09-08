import { expect, test } from "@playwright/test";
import { DownloadsPageObject } from "./page-objects/downloads.po";

test.describe("Downloads page", () => {
  test("lists one download row per compiled platform", async ({ page }) => {
    const downloads = new DownloadsPageObject(page);
    await downloads.goto();

    await expect(downloads.platformRows).toHaveCount(5);
    await expect(downloads.table).toContainText("Linux (x64)");
    await expect(downloads.table).toContainText("Windows (x64)");
  });

  test("every row has a download link into the GitHub release", async ({ page }) => {
    const downloads = new DownloadsPageObject(page);
    await downloads.goto();

    const links = downloads.downloadLinks;
    await expect(links).toHaveCount(5);

    for (const href of await links.evaluateAll(as => as.map(a => a.getAttribute("href")))) {
      expect(href).toContain("github.com/tobysmith568/gramdown/releases");
      expect(href).toMatch(/gramdown-(linux|darwin|windows)-/);
    }
  });

  test("points at the checksums file", async ({ page }) => {
    const downloads = new DownloadsPageObject(page);
    await downloads.goto();

    await expect(downloads.checksumsLink).toHaveAttribute("href", /releases\/.*\/SHA256SUMS\.txt$/);
  });
});
