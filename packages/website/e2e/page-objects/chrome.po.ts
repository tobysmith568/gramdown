import type { Locator, Page } from "@playwright/test";

/** The site-wide chrome: the skip link, the header nav and the footer. */
export class ChromePageObject {
  constructor(private readonly page: Page) {}

  get skipLink(): Locator {
    return this.page.locator("a.skip-link");
  }

  get header(): Locator {
    return this.page.locator("header");
  }

  get wordmark(): Locator {
    return this.page.locator("header a.wordmark");
  }

  /** A primary-nav link by its visible text ("Docs", "Downloads", "GitHub"). */
  headerLink(label: string): Locator {
    return this.page.locator("header nav.bar .links a", { hasText: label });
  }

  /** The nav link currently marked as the page (`aria-current="page"`). */
  get currentHeaderLink(): Locator {
    return this.page.locator('header nav.bar .links a[aria-current="page"]');
  }

  get menuToggle(): Locator {
    return this.page.locator("header button.toggle");
  }

  get footer(): Locator {
    return this.page.locator("footer");
  }

  footerLink(label: string): Locator {
    return this.page.locator("footer a", { hasText: label });
  }
}
