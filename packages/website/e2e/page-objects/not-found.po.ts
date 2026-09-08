import type { Locator, Page, Response } from "@playwright/test";
import { MetaPageObject } from "./meta.po";

export class NotFoundPageObject {
  readonly meta: MetaPageObject;

  constructor(private readonly page: Page) {
    this.meta = new MetaPageObject(page);
  }

  goto(path = "/no-such-page"): Promise<Response | null> {
    return this.page.goto(path);
  }

  get heading(): Locator {
    return this.page.locator("main h1");
  }

  get requestedPath(): Locator {
    return this.page.locator("#requested-path");
  }

  get routeLinks(): Locator {
    return this.page.locator(".output a");
  }
}
