import type { Locator, Page } from "@playwright/test";
import { ChromePageObject } from "./chrome.po";
import { MetaPageObject } from "./meta.po";

export class DocsPageObject {
  readonly meta: MetaPageObject;
  readonly chrome: ChromePageObject;

  constructor(private readonly page: Page) {
    this.meta = new MetaPageObject(page);
    this.chrome = new ChromePageObject(page);
  }

  /** `""` for the `/docs` overview, or a slug like `"cli"`. */
  async goto(slug = ""): Promise<void> {
    await this.page.goto(slug ? `/docs/${slug}` : "/docs");
  }

  get heading(): Locator {
    return this.page.locator("article.content h1");
  }

  get sidebar(): Locator {
    return this.page.locator('aside.sidebar nav[aria-label="Docs"]');
  }

  get sidebarLinks(): Locator {
    return this.sidebar.locator("a");
  }

  sidebarLink(label: string): Locator {
    return this.sidebar.locator("a", { hasText: label });
  }

  get currentSidebarLink(): Locator {
    return this.sidebar.locator('a[aria-current="page"]');
  }

  get codeBlocks(): Locator {
    return this.page.locator("article.content pre.astro-code");
  }

  get installMethods(): Locator {
    return this.page.getByTestId("install-methods");
  }

  get installMethodTabs(): Locator {
    return this.installMethods.getByRole("tab");
  }

  get activeInstallMethodTab(): Locator {
    return this.installMethods.getByRole("tab", { selected: true });
  }

  get installMethodPanel(): Locator {
    return this.installMethods.getByRole("tabpanel");
  }
}
