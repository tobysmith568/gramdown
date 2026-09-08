import type { Locator, Page } from "@playwright/test";
import { MetaPageObject } from "./meta.po";

export class DownloadsPageObject {
  readonly meta: MetaPageObject;

  constructor(private readonly page: Page) {
    this.meta = new MetaPageObject(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/docs/downloads");
  }

  get table(): Locator {
    return this.page.locator("figure.downloads table");
  }

  get platformRows(): Locator {
    return this.table.locator("tbody tr");
  }

  get downloadLinks(): Locator {
    return this.table.locator("tbody tr a", { hasText: "Download" });
  }

  get checksumsLink(): Locator {
    return this.page.locator("figure.downloads a", { hasText: "SHA256SUMS.txt" });
  }
}
