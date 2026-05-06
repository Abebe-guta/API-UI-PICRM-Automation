// =============================================================
// fixtures/base.fixture.js
// PURPOSE: Standardised test environment — reads token saved by
//          globalSetup.js and injects it into every service/API.
//
// WHAT CHANGED FROM BEFORE:
//   ✅ Reads .auth/token.json written by globalSetup
//   ✅ Calls baseAPI.setToken() BEFORE any API call is made
//   ✅ Exposes `baseAPI` and `segmentAPI` as fixtures so tests
//      never need to construct them manually in beforeAll
//   ✅ builder also gets the token via its own internal baseAPI
// =============================================================

import { test as base, expect } from '@playwright/test';
import { SegmentBuilderService } from '../services/segmentBuilder.service.js';
import { SegmentAPI }            from '../api/segment.api.js';
import { BaseAPI }               from '../api/base.api.js';
import {
  DEFAULT_CONFIG,
  seedAnnotation,
  schemaAnnotation
} from '../utils/testData.js';
import { formatRunLabel } from '../utils/helpers.js';
import fs   from 'fs';
import path from 'path';

// ----------------------------------------------------------
// TOKEN READER
// globalSetup.js writes this file once before any test runs.
// Every fixture reads from it — no per-test login calls.
// ----------------------------------------------------------
const TOKEN_FILE = path.resolve('.auth/token.json');

function readSavedToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(
      `❌ .auth/token.json not found.\n` +
      `   globalSetup must run before tests.\n` +
      `   Check that globalSetup is set in playwright.config.js`
    );
  }
  const { token } = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  if (!token) throw new Error('❌ Token in .auth/token.json is empty');
  return token;
}

// ----------------------------------------------------------
// SEED ENGINE (Park-Miller LCG)
// ----------------------------------------------------------
function createSeededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function rand() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function resolveSeed(overrideSeed) {
  if (process.env.SEED)      return parseInt(process.env.SEED, 10);
  if (overrideSeed !== undefined) return overrideSeed;
  return DEFAULT_CONFIG.defaultSeed;
}

// =============================================================
// EXTENDED FIXTURES
// =============================================================
export const test = base.extend({

  // ----------------------------------------------------------
  // seed
  // ----------------------------------------------------------
  seed: [async ({}, use, testInfo) => {
    const seed = resolveSeed(testInfo.project?.use?.seed);
    testInfo.annotations.push(seedAnnotation(seed));
    await use(seed);
  }, { scope: 'test' }],

  // ----------------------------------------------------------
  // rand
  // ----------------------------------------------------------
  rand: [async ({ seed }, use) => {
    await use(createSeededRng(seed));
  }, { scope: 'test' }],

  // ----------------------------------------------------------
  // runLabel
  // ----------------------------------------------------------
  runLabel: [async ({ seed }, use) => {
    await use(formatRunLabel(seed));
  }, { scope: 'test' }],

  // ----------------------------------------------------------
  // baseAPI
  // A fully authenticated BaseAPI instance.
  // Tests and beforeAll blocks import this instead of building
  // their own — this guarantees the token is always set.
  //
  // FLOW:
  //   1. Read token from .auth/token.json (written by globalSetup)
  //   2. new BaseAPI() + init() → creates requestContext
  //   3. setToken(token) → all subsequent requests include Bearer
  //   4. Expose to test
  //   5. Teardown: dispose requestContext
  // ----------------------------------------------------------
  baseAPI: [async ({}, use) => {
    const token  = readSavedToken();         // ← read once-saved token
    const api    = new BaseAPI({ logger: console });
    await api.init();                        // ← create requestContext
    api.setToken(token);                     // ← inject token BEFORE any call

    await use(api);

    await api.requestContext?.dispose();     // ← clean up after test
  }, { scope: 'test' }],

  // ----------------------------------------------------------
  // segmentAPI
  // Ready-to-use SegmentAPI wired to the authenticated baseAPI.
  // Tests never need: new SegmentAPI(new BaseAPI(...))
  // ----------------------------------------------------------
  segmentAPI: [async ({ baseAPI }, use) => {
    await use(new SegmentAPI(baseAPI));
  }, { scope: 'test' }],

  // ----------------------------------------------------------
  // builder
  // SegmentBuilderService with its own internal authenticated
  // BaseAPI. It creates a separate HTTP client because it also
  // needs to call ColumnsAPI — keeping it isolated from segmentAPI
  // prevents resource contention on the same requestContext.
  //
  // FLOW:
  //   1. Read saved token
  //   2. new SegmentBuilderService({ seed, ... })
  //   3. service.init() → boots its own BaseAPI, sets token,
  //      fetches table list, fetches + normalises columns
  //   4. Annotate test with schemaHash
  //   5. Expose to test
  //   6. Teardown: service.dispose()
  // ----------------------------------------------------------
  builder: [async ({ seed }, use, testInfo) => {
    const token   = readSavedToken();

    const service = new SegmentBuilderService({
      seed,
      logger: console,
      config: testInfo.project?.use?.builderConfig ?? {},
      // Pass token so service can inject it into its internal BaseAPI
      // after init() — see segmentBuilder.service.js init() below
      token,
    });

    await service.init();

    testInfo.annotations.push(schemaAnnotation(service.schemaHash));

    await use(service);

    await service.dispose();
  }, { scope: 'test' }],

});

export { expect };