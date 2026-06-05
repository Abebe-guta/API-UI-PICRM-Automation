import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./globalSetup.js",

  fullyParallel: !process.env.CI,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
    ["allure-playwright"],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "API",
      testMatch: "**/tests/api/**/*.spec.js",
      use: {
        builderConfig: {
          numericCount: 1,
          categoricalCount: 1,
          metricsCount: 1,
        },
      },
    },
    {
      name: "SCREENING",
      testMatch: "**/tests/ui/screening-features/**/*.spec.js",
      use: {
        ...devices["Desktop Chrome"],
        headless: !!process.env.CI,
        navigationTimeout: 45000,
      },
    },
    {
      name: "JOURNEY",
      testMatch: "**/tests/ui/segment-journeys/**/*.spec.js",
      timeout: 120000,
      use: {
        ...devices["Desktop Chrome"],
        headless: !!process.env.CI,
        navigationTimeout: 45000,
      },
    },
    {
      name: "ANALYTICS",
      testMatch: "**/tests/ui/ui-db-validation/**/*.spec.js",
      timeout: 180000,
      use: {
        ...devices["Desktop Chrome"],
        headless: !!process.env.CI,
        navigationTimeout: 45000,
      },
    },
    {
      name: "DB",
      testMatch: "**/tests/db/**/*.spec.js",
      use: {
        builderConfig: {
          numericCount: 1,
          categoricalCount: 1,
          metricsCount: 1,
        },
      },
    },
    {
      name: "E2E",
      testMatch: "**/tests/hybrid/**/*.spec.js",
      use: {
        ...devices["Desktop Chrome"],
        headless: !!process.env.CI,
        navigationTimeout: 45000,
        builderConfig: {
          numericCount: 1,
          categoricalCount: 1,
          metricsCount: 1,
        },
      },
    },
  ],

  outputDir: "test-results/",
});
