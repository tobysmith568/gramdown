import { defineConfig, devices } from "@playwright/test";

// The suite runs against the built site served by `astro preview` - there is no server
// component or Worker route to exercise, so a plain static preview is enough.
// The converter itself runs entirely in the browser.
//
// `webServer.command` builds the site through turbo first (a cache hit in CI, where the `e2e`
// turbo task already depends on `build`) so `bun run e2e` works from a clean checkout.
const port = 4321;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "on-first-retry"
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } }
  ],

  webServer: {
    command: `bunx turbo run build --filter=@gramdown/website && bunx astro preview --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Astro 7's `preview` moves itself to the background the moment it detects an "agentic"
    // shell (the `CLAUDECODE` env var and friends) and then exits, which reads to Playwright
    // as the server dying. Any non-empty value for this var opts out of that auto-detection
    // and keeps the server in the foreground; it is inert in ordinary CI.
    env: { ASTRO_PREVIEW_BACKGROUND: "1" }
  }
});
