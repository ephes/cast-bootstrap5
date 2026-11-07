import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./browser",
  testMatch: "**/*.e2e.ts",
  use: { baseURL: "http://127.0.0.1:5174", browserName: "chromium" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --strictPort --base /",
    url: "http://127.0.0.1:5174/browser/focus.html",
    reuseExistingServer: false,
  },
});
