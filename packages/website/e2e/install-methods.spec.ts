import { expect, test } from "@playwright/test";
import { DocsPageObject } from "./page-objects/docs.po";
import { IndexPageObject } from "./page-objects/index.po";

// The pure OS -> order/command logic is already covered at the unit level
// (src/lib/installOrder.test.ts, src/lib/installCommands.test.ts), including
// the crawler-UA cases. What only a real browser can prove is the wiring
// end to end: that `navigator.userAgent` actually reaches these components,
// and that content is genuinely visible (not just present in the DOM) once
// revealed - or, with no JS, visible immediately instead of hidden forever.

const windowsUa =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const macUa =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

test.describe("Install method personalization", () => {
  test.describe("on Windows", () => {
    // Both browser projects (playwright.config.ts) already default to a
    // Windows-flavoured UA (Playwright's "Desktop Chrome"/"Desktop Firefox"
    // presets are fixed, not host-OS-dependent) - overriding it explicitly
    // anyway keeps this test's intent self-documenting and robust if that
    // config ever changes.
    test.use({ userAgent: windowsUa });

    test("the hero leads with npm", async ({ page }) => {
      const index = new IndexPageObject(page);
      await index.goto();

      await expect(index.heroCommand).toHaveCSS("opacity", "1");
      await expect(index.installLines.first()).toHaveText("npm install -g gramdown");
    });

    test("the docs tabs drop the shell installer and Homebrew", async ({ page }) => {
      const docs = new DocsPageObject(page);
      await docs.goto();

      await expect(docs.installMethodTabs).toHaveText(["npm", "Standalone binary"]);
      await expect(docs.activeInstallMethodTab).toHaveText("npm");
    });
  });

  test.describe("on macOS", () => {
    test.use({ userAgent: macUa });

    test("the hero leads with Homebrew", async ({ page }) => {
      const index = new IndexPageObject(page);
      await index.goto();

      await expect(index.installLines.first()).toHaveText("brew install tobysmith568/tap/gramdown");
    });

    test("the docs tabs lead with Homebrew, ahead of the shell installer", async ({ page }) => {
      const docs = new DocsPageObject(page);
      await docs.goto();

      await expect(docs.installMethodTabs).toHaveText([
        "Homebrew (macOS)",
        "Shell install (Linux, macOS)",
        "npm",
        "Standalone binary"
      ]);
      await expect(docs.activeInstallMethodTab).toHaveText("Homebrew (macOS)");
    });
  });

  test.describe("with JavaScript disabled", () => {
    test.use({ javaScriptEnabled: false });

    test("the hero still shows the shell installer, visibly", async ({ page }) => {
      const index = new IndexPageObject(page);
      await index.goto();

      await expect(index.heroCommand).toHaveCSS("opacity", "1");
      await expect(index.installLines.first()).toHaveText(
        "curl -fsSL https://gramdown.tobythe.dev/install.sh | sh"
      );
    });

    test("the docs tabs still show every method, visibly", async ({ page }) => {
      const docs = new DocsPageObject(page);
      await docs.goto();

      await expect(docs.installMethods).toHaveCSS("opacity", "1");
      await expect(docs.installMethodTabs).toHaveCount(4);
    });
  });
});
