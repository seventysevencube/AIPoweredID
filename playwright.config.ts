import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:local",
    env: { LOCAL_BROWSER_TEST: "1" },
    url: "http://127.0.0.1:5173/api/setup",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
