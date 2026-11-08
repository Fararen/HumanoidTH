import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests-node", testMatch: "hri-lab.spec.ts", workers: 1, reporter: "line",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3217", screenshot: "only-on-failure" },
  webServer: { command: "node scripts/test-hri-server.mjs", url: "http://127.0.0.1:3217", reuseExistingServer: false }
});
