import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  testDir: './tests',
  globalSetup: './globalSetup.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    // ❌ REMOVED: storageState: path.resolve(__dirname, '.auth/browser.json'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.js',
      use: {
        builderConfig: {
          numericCount: 1,
          categoricalCount: 1,
          metricsCount: 1,
        }
      }
    },
    {
      name: 'ui',
      testMatch: '**/tests/ui/**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        // ❌ REMOVED: extraHTTPHeaders: { Authorization: `Bearer ${process.env.TOKEN}` },
        // ❌ REMOVED: storageState: '.auth/browser.json',
        navigationTimeout: 45000,
      }
    },
    {
      name: 'e2e',
      testMatch: '**/tests/hybrid/**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        navigationTimeout: 45000,
        builderConfig: {
          numericCount: 1,
          categoricalCount: 1,
          metricsCount: 1,
        }
      }
    },
  ],

  outputDir: 'test-results/',
});