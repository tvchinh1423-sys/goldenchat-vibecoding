import { defineConfig } from "@playwright/test";

const useWebKit = process.env.PLAYWRIGHT_WEBKIT === "1";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: useWebKit ? "webkit" : "chromium",
    channel: useWebKit ? undefined : "chrome",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/inbox",
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
