// =============================================================
// globalSetup.js
// PURPOSE: Run ONCE before all workers.
//
// STEP 1: API login → save token
// STEP 2:  UI login verification (no storageState)
// =============================================================

import { chromium } from '@playwright/test';
import { AuthAPI }  from './API/auth.api.js';
import { BaseAPI }  from './API/base.api.js';

import fs     from 'fs';
import path   from 'path';
import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV = ['LOGIN_USERNAME', 'LOGIN_PASSWORD'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

const USERNAME = process.env.LOGIN_USERNAME;
const PASSWORD = process.env.LOGIN_PASSWORD;
const AUTH_DIR   = path.resolve('.auth');
const TOKEN_FILE = path.join(AUTH_DIR, 'token.json');
const UI_BASE = (process.env.BASE_URL ?? 'http://3.216.34.218:9192/picr').replace(/\/$/, '');
const LOGIN_URL = `${UI_BASE}/login`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export default async function globalSetup() {
  ensureDir(AUTH_DIR);

  // STEP 1: API TOKEN LOGIN
  console.log('\n🔐 [globalSetup] STEP 1: API token login...');
  const baseAPI = new BaseAPI({ logger: console });
  await baseAPI.init();
  const authAPI = new AuthAPI(baseAPI);
  let token;
  try {
    token = await authAPI.login(USERNAME, PASSWORD);
    token = token?.access_token || token;
    if (!token || typeof token !== 'string') throw new Error('Invalid token');
  } catch (err) {
    throw new Error(`API login failed: ${err.message}`);
  } finally {
    await baseAPI.requestContext?.dispose();
  }

  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, savedAt: new Date().toISOString() }, null, 2));
  console.log(`✅ API token saved → ${TOKEN_FILE}`);

  // STEP 2: OPTIONAL UI VERIFICATION (no storageState saved)
  console.log(`\n🌐 [globalSetup] UI login verification`);
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByPlaceholder('Enter your username').fill(USERNAME);
    await page.getByPlaceholder('Enter your password').fill(PASSWORD);
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60000 }),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);
    console.log(`✅ UI login successful → ${page.url()}`);
  } finally {
    await browser.close();
  }
}