import type { Locator, Page } from "@playwright/test";
import { MetaPageObject } from "./meta.po";

/** Any of the three legal pages (`/terms`, `/privacy`, `/cookies`). */
export class PolicyPageObject {
  readonly meta: MetaPageObject;

  constructor(
    private readonly page: Page,
    private readonly path: string
  ) {
    this.meta = new MetaPageObject(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  get heading(): Locator {
    return this.page.locator("article.content h1");
  }

  get lastUpdated(): Locator {
    return this.page.locator(".rail time");
  }

  get railLinks(): Locator {
    return this.page.locator('.rail nav[aria-label="Legal"] a');
  }

  get currentRailLink(): Locator {
    return this.page.locator('.rail nav[aria-label="Legal"] a[aria-current="page"]');
  }
}
