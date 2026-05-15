// =============================================================
// fixtures/base.fixture.js
// =============================================================

import { test as base, expect } from '@playwright/test';

import { SegmentBuilderService } from '../services/segmentBuilder.service.js';
import { SegmentAPI }            from '../api/segment.api.js';
import { BaseAPI }               from '../api/base.api.js';

import {
  seedAnnotation,
  schemaAnnotation,
} from '../utils/testData.js';

import { formatRunLabel } from '../utils/helpers.js';

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
// RNG
// =============================================================

function createSeededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function rand() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function resolveSeed(overrideSeed) {
  if (process.env.SEED) return Number(process.env.SEED);
  if (overrideSeed !== undefined) return overrideSeed;
  return Math.floor(Math.random() * 2147483646) + 1;
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

  seed: [async ({}, use, testInfo) => {
    const seed = resolveSeed(testInfo.project?.use?.seed);
    testInfo.annotations.push(seedAnnotation(seed));
    await use(seed);
  }, { scope: 'test' }],

  rand: [async ({ seed }, use) => {
    await use(createSeededRng(seed));
  }, { scope: 'test' }],

  runLabel: [async ({ seed }, use) => {
    await use(formatRunLabel(seed));
  }, { scope: 'test' }],

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

  builder: [async ({ seed }, use, testInfo) => {
    const token = readSavedToken();
    const service = new SegmentBuilderService({
      seed,
      logger: console,
      config: testInfo.project?.use?.builderConfig ?? {},
      token,
    });
    await service.init();
    testInfo.annotations.push(schemaAnnotation(service.schemaHash));
    await use(service);
    await service.dispose();
  }, { scope: 'test' }],

  // ✅ New worker‑scoped shared page – avoids conflict with built‑in 'page'
  sharedPage: [async ({ browser }, use) => {
    if (!sharedPage) {
      console.log('\n🔐 [Worker] Initialising shared page – token injection once');
      const token = readSavedToken();
      const baseURL = (process.env.BASE_URL ?? 'http://3.216.34.218:9192/picr').replace(/\/$/, '');
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();

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