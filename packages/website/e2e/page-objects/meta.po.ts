import type { Page } from "@playwright/test";

/** Shared `<head>` metadata accessors, composed into every page object. */
export class MetaPageObject {
  constructor(private readonly page: Page) {}

  title(): Promise<string> {
    return this.page.title();
  }

  description(): Promise<string | null> {
    return this.content('meta[name="description"]');
  }

  canonical(): Promise<string | null> {
    return this.page.locator('head link[rel="canonical"]').getAttribute("href");
  }

  robots(): Promise<string | null> {
    return this.content('meta[name="robots"]');
  }

  ogTitle(): Promise<string | null> {
    return this.content('meta[property="og:title"]');
  }

  ogImage(): Promise<string | null> {
    return this.content('meta[property="og:image"]');
  }

  private content(selector: string): Promise<string | null> {
    return this.page.locator(`head ${selector}`).getAttribute("content");
  }
}
