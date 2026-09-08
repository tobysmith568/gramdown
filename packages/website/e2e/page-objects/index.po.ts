import type { Locator, Page } from "@playwright/test";
import { ChromePageObject } from "./chrome.po";
import { ConverterPageObject } from "./converter.po";
import { MetaPageObject } from "./meta.po";

export class IndexPageObject {
  readonly meta: MetaPageObject;
  readonly chrome: ChromePageObject;
  readonly converter: ConverterPageObject;

  constructor(private readonly page: Page) {
    this.meta = new MetaPageObject(page);
    this.chrome = new ChromePageObject(page);
    this.converter = new ConverterPageObject(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  get heading(): Locator {
    return this.page.locator("main h1");
  }

  get lead(): Locator {
    return this.page.locator("main .lead");
  }

  /** The `$ …` install snippet lines in the hero. */
  get installLines(): Locator {
    return this.page.locator("main .cmd .cmd-line");
  }

  get browserConverterHeading(): Locator {
    return this.page.locator("#converter-heading");
  }

  tailLink(label: string): Locator {
    return this.page.locator('nav[aria-label="More"] a', { hasText: label });
  }
}
