import { expect, test } from "@playwright/test";
import { ChromePageObject } from "./page-objects/chrome.po";
import { NotFoundPageObject } from "./page-objects/not-found.po";

test.describe("Navigation", () => {
  test("moves between the index, the docs and a legal page via the chrome", async ({ page }) => {
    const chrome = new ChromePageObject(page);
    await page.goto("/");

    await chrome.headerLink("Docs").click();
    await expect(page).toHaveURL("/docs");
    await expect(page.locator("article.content h1")).toHaveText("Overview");

    await chrome.footerLink("Privacy").click();
    await expect(page).toHaveURL("/privacy");

    await chrome.wordmark.click();
    await expect(page).toHaveURL("/");
  });

  test("marks the active section in the header", async ({ page }) => {
    const chrome = new ChromePageObject(page);

    await page.goto("/docs/cli");
    await expect(chrome.currentHeaderLink).toHaveText("Docs");

    await page.goto("/");
    await expect(chrome.currentHeaderLink).toHaveCount(0);
  });

  test("exposes a working skip link", async ({ page }) => {
    const chrome = new ChromePageObject(page);
    await page.goto("/");

    await page.keyboard.press("Tab");
    await expect(chrome.skipLink).toBeFocused();
    await expect(chrome.skipLink).toHaveAttribute("href", "#main");
  });

  test("opens and closes the mobile nav menu", async ({ page }) => {
    const chrome = new ChromePageObject(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");

    await expect(chrome.menuToggle).toBeVisible();
    await expect(chrome.menuToggle).toHaveAttribute("aria-expanded", "false");

    await chrome.menuToggle.click();
    await expect(chrome.menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(chrome.headerLink("Downloads")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(chrome.menuToggle).toHaveAttribute("aria-expanded", "false");
  });

  test("serves the 404 page for an unknown address", async ({ page }) => {
    const notFound = new NotFoundPageObject(page);
    const response = await notFound.goto("/definitely-not-real");

    expect(response?.status()).toBe(404);
    await expect(notFound.heading).toHaveText("There's no page here");
    await expect(notFound.requestedPath).toHaveText("/definitely-not-real");
    await expect(notFound.routeLinks.filter({ hasText: "Home" })).toHaveAttribute("href", "/");
  });
});
