import { fixturePath, type FixtureName } from "@gramdown/fixtures";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The index-page converter panel (`src/components/converter/ConverterPanel.tsx`).
 * The panel is a hydrated island, so most of these locators wait on client JS -
 * `waitForReady` is the usual gate before asserting on a row.
 */
export class ConverterPageObject {
  constructor(private readonly page: Page) {}

  get section(): Locator {
    return this.page.locator("#converter");
  }

  get panel(): Locator {
    return this.page.getByTestId("converter");
  }

  get fileInput(): Locator {
    return this.section.locator('input[type="file"]');
  }

  /** Every row in the file explorer, including the always-present worked example. */
  get rows(): Locator {
    return this.page.getByTestId("file-row");
  }

  /** The row for `outputName`, located by the `data-name` on the row element itself. */
  rowByName(outputName: string): Locator {
    return this.page.locator(`[data-testid="file-row"][data-name="${outputName}"]`);
  }

  status(outputName: string): Promise<string | null> {
    return this.rowByName(outputName).getAttribute("data-status");
  }

  get sampleRow(): Locator {
    return this.rowByName("sample.md");
  }

  get paneFilename(): Locator {
    return this.page.getByTestId("pane-filename");
  }

  get paneDownloadButton(): Locator {
    return this.page.getByTestId("pane").getByRole("button", { name: "Download" });
  }

  get paneCopyButton(): Locator {
    return this.page.getByTestId("pane").getByRole("button", { name: /^Cop/ });
  }

  get guessLanguagesCheckbox(): Locator {
    return this.page.getByLabel("Guess code languages");
  }

  get downloadAllButton(): Locator {
    return this.page.getByRole("button", { name: /Download all/ });
  }

  get rejectionNote(): Locator {
    return this.section.getByText(/^Skipped/);
  }

  get liveRegion(): Locator {
    return this.page.locator('#converter p[role="status"]');
  }

  /** Wait for the island to finish hydrating (the loading placeholder is gone). */
  async waitForHydration(): Promise<void> {
    await this.page.getByTestId("converter").waitFor();
  }

  /** Push one or more fixture `.docx` files through the panel's file input. */
  async convertFixtures(...names: FixtureName[]): Promise<void> {
    await this.fileInput.setInputFiles(names.map(fixturePath));
  }

  /** Wait for `outputName`'s row to reach the `ready` state. */
  async waitForReady(outputName: string): Promise<void> {
    await this.page
      .locator(`[data-testid="file-row"][data-name="${outputName}"][data-status="ready"]`)
      .waitFor();
  }

  /**
   * Wait until `outputName` has actually been written to IndexedDB (the store
   * debounces its writes), so a navigation that follows is sure to rehydrate it.
   */
  async waitForPersisted(outputName: string): Promise<void> {
    await expect
      .poll(() =>
        this.page.evaluate(
          name =>
            new Promise<boolean>(resolve => {
              const request = indexedDB.open("gramdown-conversions");
              request.onerror = () => resolve(false);
              request.onsuccess = () => {
                const db = request.result;
                try {
                  const read = db
                    .transaction("conversions", "readonly")
                    .objectStore("conversions")
                    .get("queue");
                  read.onerror = () => resolve(false);
                  read.onsuccess = () => {
                    const rows = (read.result ?? []) as { outputName: string }[];
                    resolve(rows.some(row => row.outputName === name));
                  };
                } catch {
                  resolve(false);
                }
              };
            }),
          outputName
        )
      )
      .toBe(true);
  }
}
