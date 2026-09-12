import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

test.describe("install.sh", () => {
  test("is served at the site root with the source content", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/install.sh`);
    expect(response.status()).toBe(200);

    const sourcePath = fileURLToPath(new URL("../public/install.sh", import.meta.url));
    expect(await response.text()).toBe(readFileSync(sourcePath, "utf8"));
  });
});
