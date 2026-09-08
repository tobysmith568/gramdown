import { expect, test } from "@playwright/test";
import { MetaPageObject } from "./page-objects/meta.po";

test.describe("SEO & metadata", () => {
  test("holds the whole site out of search results pre-launch", async ({ page }) => {
    const meta = new MetaPageObject(page);

    for (const path of ["/", "/docs", "/docs/cli"]) {
      await page.goto(path);
      expect(await meta.robots()).toBe("noindex, nofollow");
    }
  });

  test("robots.txt disallows everything while indexing is held", async ({ page }) => {
    const response = await page.goto("/robots.txt");

    expect(response?.ok()).toBe(true);
    expect(await response?.text()).toContain("Disallow: /");
  });

  test("each page has a self-referential canonical at its clean path", async ({ page }) => {
    const meta = new MetaPageObject(page);

    await page.goto("/docs/cli");
    expect(await meta.canonical()).toBe("https://gramdown.tobythe.dev/docs/cli");

    await page.goto("/terms");
    expect(await meta.canonical()).toBe("https://gramdown.tobythe.dev/terms");
  });

  test("carries Open Graph tags for social cards", async ({ page }) => {
    const meta = new MetaPageObject(page);
    await page.goto("/");

    expect(await meta.ogTitle()).toBe("gramdown - Convert Grammarly .docx exports to Markdown");
    expect(await meta.ogImage()).toBe("https://gramdown.tobythe.dev/og.png");
  });

  test("emits a sitemap", async ({ page }) => {
    const response = await page.goto("/sitemap-index.xml");

    expect(response?.ok()).toBe(true);
    expect(await response?.text()).toContain("sitemap");
  });
});
