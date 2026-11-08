import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests-node", testMatch: "platform.spec.ts", workers: 1, timeout: 90000, reporter: "line",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3000", screenshot: "only-on-failure", trace: "retain-on-failure" }
});
