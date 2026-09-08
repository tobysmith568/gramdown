import { expect, test } from "@playwright/test";
import { PolicyPageObject } from "./page-objects/policy.po";

const policies = [
  { path: "/terms", title: "Terms & Conditions" },
  { path: "/privacy", title: "Privacy Policy" },
  { path: "/cookies", title: "Cookies Policy" }
];

test.describe("Legal pages", () => {
  for (const { path, title } of policies) {
    test(`${title} renders with a dated rail and stays out of the index`, async ({ page }) => {
      const policy = new PolicyPageObject(page, path);
      await policy.goto();

      await expect(policy.heading).toHaveText(title);
      expect(await policy.meta.title()).toBe(`${title} - gramdown`);

      // Held back pre-launch site-wide, and these pages also carry their own noindex.
      expect(await policy.meta.robots()).toContain("noindex");

      await expect(policy.lastUpdated).toHaveAttribute("datetime", "2026-09-06");
      await expect(policy.lastUpdated).toContainText("2026");
      await expect(policy.currentRailLink).toHaveText(title.split(" ")[0]!);
    });
  }

  test("the rail links the three policies to each other", async ({ page }) => {
    const policy = new PolicyPageObject(page, "/terms");
    await policy.goto();

    await expect(policy.railLinks).toHaveText(["Terms", "Privacy", "Cookies"]);

    await policy.railLinks.filter({ hasText: "Cookies" }).click();
    await expect(page).toHaveURL("/cookies");
  });
});
