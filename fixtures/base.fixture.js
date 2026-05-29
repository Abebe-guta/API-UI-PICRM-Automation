// =============================================================
// fixtures/base.fixture.js
// =============================================================

/*Big Picture (What this file does)
This file creates a custom test environment that automatically provides:
🔐 Authentication token handling
📡 API clients (BaseAPI, SegmentAPI)
🏗️ Test data builder service
🌐 A shared logged-in browser page (per worker)
*/

import { test as base, expect } from '@playwright/test';

import { SegmentBuilderService } from '../services/segmentBuilder.service.js';
import { SegmentAPI }            from '../API/segment.api.js';
import { BaseAPI }               from '../API/base.api.js';

import {schemaAnnotation} from '../utils/testData.js';

import fs   from 'fs';
import path from 'path';

// =============================================================
// TOKEN
// =============================================================

const TOKEN_FILE = path.resolve('.auth/token.json');
let cachedToken = null;

function readSavedToken() {
  if (cachedToken) return cachedToken;
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('❌ Missing .auth/token.json');
  }
  const { token } = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  if (!token) throw new Error('❌ Empty token in token.json');
  cachedToken = token;
  return cachedToken;
}

// =============================================================
// SHARED WORKER‑SCOPED PAGE (token injected once)
// =============================================================

let sharedPage = null;
let sharedContext = null;

// =============================================================
// FIXTURES
// =============================================================

export const test = base.extend({

  baseAPI: [async ({}, use) => {
    const token = readSavedToken();
    console.log(`🔐 baseAPI token length: ${token.length}`);
    const api = new BaseAPI({ logger: console });
    await api.init(token);
    if (!api.token) api.setToken(token);
    await use(api);
    await api.requestContext?.dispose();
  }, { scope: 'worker' }],

  segmentAPI: [async ({ baseAPI }, use) => {
    await use(new SegmentAPI(baseAPI));
  }, { scope: 'worker' }],

  builder: [async ({ }, use, testInfo) => {
    const token = readSavedToken();
    const service = new SegmentBuilderService({
      logger: console,
      config: testInfo.project?.use?.builderConfig ?? {},
      token,
    });
    await service.init();
    testInfo.annotations.push(schemaAnnotation(service.schemaHash));
    await use(service);
    await service.dispose();
  }, { scope: 'test' }],

  // New worker‑scoped shared page – avoids conflict with built‑in 'page'
  sharedPage: [async ({ browser }, use) => {
    if (!sharedPage) {
      console.log('\n🔐 [Worker] Initialising shared page – token injection once');
      const token = readSavedToken();
      const baseURL = (process.env.BASE_URL ?? 'http://3.216.34.218:9192/picr').replace(/\/$/, '');
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      //inject token before page loads app
      await sharedPage.addInitScript((jwt) => {
        sessionStorage.setItem('auth_token', jwt);
        sessionStorage.setItem('token', jwt);
        sessionStorage.setItem('access_token', jwt);
      }, token);

      await sharedPage.goto(`${baseURL}/dashboard/portfolio-overview`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      await sharedPage.locator('text=Portfolio Overview').waitFor({
        state: 'visible',
        timeout: 30000,
      });

      console.log('AFTER AUTH FLOW (worker):', sharedPage.url());

      if (sharedPage.url().includes('/login')) {
        throw new Error('❌ Authentication failed after injection');
      }
    } else {
      console.log('♻️ [Worker] Reusing existing authenticated page');
    }
    await use(sharedPage);
  }, { scope: 'worker' }],
});

export { expect };