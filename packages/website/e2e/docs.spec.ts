import { expect, test } from "@playwright/test";
import { DocsPageObject } from "./page-objects/docs.po";

const pages = [
  { slug: "", heading: "Overview" },
  { slug: "cli", heading: "CLI reference" },
  { slug: "api", heading: "convert() API" },
  { slug: "how-it-works", heading: "How it works" },
  { slug: "browser-converter", heading: "Browser converter" },
  { slug: "downloads", heading: "Downloads" }
];

test.describe("Docs", () => {
  for (const { slug, heading } of pages) {
    test(`renders the ${heading} page with the sidebar`, async ({ page }) => {
      const docs = new DocsPageObject(page);
      await docs.goto(slug);

      await expect(docs.heading).toHaveText(heading);
      await expect(docs.sidebarLinks).toHaveCount(pages.length);
      await expect(docs.currentSidebarLink).toHaveText(heading);
      expect(await docs.meta.title()).toBe(`${heading} - gramdown`);
    });
  }

  test("navigates between docs pages through the sidebar", async ({ page }) => {
    const docs = new DocsPageObject(page);
    await docs.goto();

    await docs.sidebarLink("CLI reference").click();
    await expect(page).toHaveURL("/docs/cli");
    await expect(docs.heading).toHaveText("CLI reference");
  });

  test("syntax-highlights code blocks", async ({ page }) => {
    const docs = new DocsPageObject(page);
    await docs.goto("cli");

    await expect(docs.codeBlocks.first()).toBeVisible();
  });
});
