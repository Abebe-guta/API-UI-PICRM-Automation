// =============================================================
// globalSetup.js
// PURPOSE: Run ONCE before any test worker starts.
//          Logs in, saves token to .auth/token.json.
//          All tests read the token from there — no per-test login.
//
// WHY GLOBAL SETUP AND NOT A FIXTURE?
//   Fixtures run per-test (or per-worker at best). If you have
//   20 tests, a worker-scoped login fixture still logs in once
//   PER WORKER — so with 4 workers = 4 logins. Global setup
//   runs exactly once for the entire suite regardless of workers.
//
// HOW IT CONNECTS:
//   playwright.config.js → globalSetup: './globalSetup.js'
//   globalSetup writes  → .auth/token.json
//   base.fixture.js reads ← .auth/token.json
//   BaseAPI.setToken()  ← called with the saved token
// =============================================================

import { request } from '@playwright/test';
import { AuthAPI }  from './api/Auth.api.js';
import { BaseAPI }  from './api/base.api.js';
import fs           from 'fs';
import path         from 'path';
import dotenv       from 'dotenv';

// Load .env before reading any process.env values
// WHY here? globalSetup runs before Playwright loads config,
// so dotenv must be called explicitly at the top of this file.
dotenv.config();

// Token is saved here — this path is gitignored (see .gitignore)
// WHY a file and not process.env?
//   process.env is per-process. Playwright spawns multiple worker
//   processes — env vars don't cross process boundaries. A file
//   on disk is the only reliable way to share state between workers.
const AUTH_DIR   = path.resolve('.auth');
const TOKEN_FILE = path.join(AUTH_DIR, 'token.json');

export default async function globalSetup() {
  console.log('\n🔐 [globalSetup] Logging in once for all tests...');

  // Ensure .auth/ directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // ----------------------------------------------------------
  // BOOT A TEMPORARY BaseAPI just for login
  // We dispose it after — it's not reused by tests.
  // ----------------------------------------------------------
  const baseAPI = new BaseAPI({ logger: console });
  await baseAPI.init();  // creates Playwright requestContext

  const authAPI = new AuthAPI(baseAPI);

  let token;
  try {
    // AuthAPI reads LOGIN_USERNAME + LOGIN_PASSWORD from process.env
    // internally — we pass empty strings as fallback defaults only
    token = await authAPI.login(
      process.env.LOGIN_USERNAME ?? '',
      process.env.LOGIN_PASSWORD ?? ''
    );
  } catch (err) {
    // Fail fast with a clear message — a missing token would cause
    // every single test to fail with a cryptic 401, harder to debug
    throw new Error(
      `[globalSetup] Login failed — check LOGIN_USERNAME and LOGIN_PASSWORD in .env\n` +
      `Original error: ${err.message}`
    );
  } finally {
    // Always dispose even if login threw
    await baseAPI.requestContext?.dispose();
  }

  // ----------------------------------------------------------
  // SAVE TOKEN
  // We also save the timestamp so we can detect stale tokens
  // if a test suite runs for a very long time (e.g. overnight CI).
  // ----------------------------------------------------------
  const authData = {
    token,
    savedAt:   new Date().toISOString(),
    expiresAt: null,   // set this if your backend returns expiry
  };

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(authData, null, 2), 'utf-8');

  console.log(`✅ [globalSetup] Token saved to ${TOKEN_FILE}`);
  console.log(`   Saved at: ${authData.savedAt}\n`);
}