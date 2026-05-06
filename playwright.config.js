// =============================================================
// playwright.config.js
// PURPOSE: Full Playwright configuration wired to the system.
//
// KEY ADDITIONS OVER DEFAULT:
//   ✅ dotenv loaded so .env is available everywhere
//   ✅ globalSetup → logs in once before any test runs
//   ✅ baseURL from ENV so tests never hardcode URLs
//   ✅ Three projects matching your test tier structure:
//        api     → tests/api/     (no browser, fastest)
//        ui      → tests/ui/      (chromium only, smoke)
//        e2e     → tests/hybrid/  (chromium, full flow)
//   ✅ SEED env var flows through to fixtures via project.use
//   ✅ HTML + JSON reporters for CI + local debugging
//   ✅ Trace on first retry so failures are always diagnosable
// =============================================================

// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path   from 'path';

// ----------------------------------------------------------
// LOAD .env
// Must happen before defineConfig() so all process.env.*
// values are available when the config object is evaluated.
// ----------------------------------------------------------
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({

  // Where Playwright looks for test files
  testDir: './tests',

  // ----------------------------------------------------------
  // GLOBAL SETUP
  // Runs once before any worker/test starts.
  // Logs in and saves token to .auth/token.json
  // ----------------------------------------------------------
  globalSetup: './globalSetup.js',

  // ----------------------------------------------------------
  // PARALLELISM
  // fullyParallel: true  → files run in parallel across workers
  // workers on CI = 1    → prevents rate limiting / flakiness
  // workers locally = auto (Playwright picks based on CPU cores)
  // ----------------------------------------------------------
  fullyParallel: true,
  forbidOnly:   !!process.env.CI,    // fail CI if test.only is committed
  retries:      process.env.CI ? 2 : 0,
  workers:      process.env.CI ? 1 : undefined,

  // ----------------------------------------------------------
  // REPORTERS
  // html  → open with: npx playwright show-report
  // json  → machine-readable for CI artifact parsing
  // list  → clean terminal output during local runs
  //
  // WHY json? CI pipelines can parse test-results.json to extract
  // seed annotations from failed tests and auto-generate replay
  // commands without opening the HTML report.
  // ----------------------------------------------------------
  reporter: [
    ['html', { open: 'never' }],          // never auto-open browser
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],                             // live terminal output
  ],

  // ----------------------------------------------------------
  // SHARED SETTINGS (applied to all projects unless overridden)
  // ----------------------------------------------------------
  use: {
    // Base URL from .env — used in page.goto('/segments') calls
    baseURL: process.env.BASE_URL,

    // Trace: captured on first retry so every flaky failure has
    // a full network + DOM timeline for debugging
    trace: 'on-first-retry',

    // Screenshot on failure — visual evidence for UI tests
    screenshot: 'only-on-failure',

    // Video on retry — helps debug timing issues in UI smoke tests
    video: 'on-first-retry',

    // Global timeout for each test (30s matches DEFAULT_CONFIG)
    actionTimeout:      30_000,
    navigationTimeout:  30_000,
  },

  // ----------------------------------------------------------
  // PROJECTS — one per test tier
  //
  // WHY separate projects instead of one?
  //   1. You can run just the fast tier: npx playwright test --project=api
  //   2. Each tier has its own browser/timeout settings
  //   3. CI can run api tier on every commit, e2e only on merge
  //   4. Each project can carry its own builderConfig (numericCount etc.)
  //   5. Seed can be pinned per project for regression runs
  // ----------------------------------------------------------
  projects: [

    // --------------------------------------------------------
    // PROJECT 1: API tier
    // No browser — fastest possible execution.
    // Uses Playwright's request fixture only.
    //
    // WHY no browser device?
    //   API tests never call page.goto() or click anything.
    //   Launching a browser would waste 2–3s per worker for nothing.
    //   Playwright supports browserless API testing natively.
    // --------------------------------------------------------
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.js',
      use: {
        // No browser device — API tests only
        // Pass seed via env: SEED=42 npx playwright test --project=api
        // Or pin a seed here for a stable regression project:
        // seed: 42,

        // Builder config overrides for this tier
        // e.g. pick more attributes to stress-test the model:
        builderConfig: {
          numericCount:     1,
          categoricalCount: 1,
          metricsCount:     1,
        }
      }
    },

    // --------------------------------------------------------
    // PROJECT 2: UI smoke tier
    // Chromium only — UI is always tested in one browser first.
    // Smoke tests are thin by design (see segment.smoke.spec.js).
    // --------------------------------------------------------
    {
      name: 'ui',
      testMatch: '**/tests/ui/**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Longer navigation timeout for UI — pages can be slow to hydrate
        navigationTimeout: 45_000,
      }
    },

    // --------------------------------------------------------
    // PROJECT 3: E2E hybrid tier
    // API creates segment, Chromium verifies UI renders it.
    // This is the compliance-critical tier — runs on every merge.
    // --------------------------------------------------------
    {
      name: 'e2e',
      testMatch: '**/tests/hybrid/**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        navigationTimeout: 45_000,
        builderConfig: {
          numericCount:     1,
          categoricalCount: 1,
          metricsCount:     1,
        }
      }
    },

  ],

  // ----------------------------------------------------------
  // OUTPUT DIRECTORIES
  // Keep generated files out of src — all gitignored
  // ----------------------------------------------------------
  outputDir: 'test-results/',

});

// =============================================================
// COMMON COMMANDS:
//
// Run all tiers:
//   npx playwright test
//
// Run only API tier (fastest, no browser):
//   npx playwright test --project=api
//
// Run only E2E:
//   npx playwright test --project=e2e
//
// Replay a specific failure by seed:
//   SEED=42 npx playwright test --project=e2e
//
// Open last HTML report:
//   npx playwright show-report
//
// Debug a single test interactively:
//   npx playwright test --project=e2e --debug
// =============================================================