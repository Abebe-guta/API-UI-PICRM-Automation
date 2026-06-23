# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI\screening-features\customer.screening.spec.js >> Customer Screening Journey >> Create segment → Screen customer → Validate results
- Location: tests\UI\screening-features\customer.screening.spec.js:15:3

# Error details

```
Fixture "sharedPage" timeout of 30000ms exceeded during setup.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - img "Kifiya Logo"
        - paragraph [ref=e8]: Credit Risk Intelligence
      - button "Close sidebar" [ref=e9] [cursor=pointer]:
        - img [ref=e10]
    - navigation [ref=e13]:
      - button "Dashboard" [ref=e15] [cursor=pointer]:
        - generic [ref=e16]:
          - img [ref=e17]
          - generic [ref=e22]: Dashboard
        - img [ref=e23]
      - button "Data Provider" [ref=e26] [cursor=pointer]:
        - generic [ref=e27]:
          - img [ref=e29]
          - generic [ref=e33]: Data Provider
        - img [ref=e34]
      - button "Segment Manager" [ref=e37] [cursor=pointer]:
        - generic [ref=e38]:
          - img [ref=e40]
          - generic [ref=e42]: Segment Manager
        - img [ref=e43]
      - button "Agentic Credit Risk" [ref=e46] [cursor=pointer]:
        - generic [ref=e47]:
          - img [ref=e49]
          - generic [ref=e57]: Agentic Credit Risk
        - img [ref=e58]
      - button "Screening" [ref=e61] [cursor=pointer]:
        - generic [ref=e62]:
          - img [ref=e64]
          - generic [ref=e69]: Screening
        - img [ref=e70]
      - button "Settings" [ref=e73] [cursor=pointer]:
        - generic [ref=e74]:
          - img [ref=e76]
          - generic [ref=e79]: Settings
        - img [ref=e80]
    - generic [ref=e83]:
      - button "A" [ref=e85] [cursor=pointer]
      - generic [ref=e86]:
        - paragraph [ref=e87]: admin
        - paragraph [ref=e88]: super_admin
  - main [ref=e89]:
    - img [ref=e91]
```

# Test source

```ts
  1   | // =============================================================
  2   | // fixtures/base.fixture.js
  3   | // =============================================================
  4   | 
  5   | /*Big Picture (What this file does)
  6   | This file creates a custom test environment that automatically provides:
  7   | 🔐 Authentication token handling
  8   | 📡 API clients (BaseAPI, SegmentAPI)
  9   | 🏗️ Test data builder service
  10  | 🌐 A shared logged-in browser page (per worker)
  11  | */
  12  | 
  13  | import { test as base, expect } from '@playwright/test';
  14  | 
  15  | import { SegmentBuilderService } from '../services/segmentBuilder.service.js';
  16  | import { SegmentAPI }            from '../API/segment.api.js';
  17  | import { BaseAPI }               from '../API/base.api.js';
  18  | 
  19  | import {schemaAnnotation} from '../utils/testData.js';
  20  | 
  21  | import fs   from 'fs';
  22  | import path from 'path';
  23  | 
  24  | // =============================================================
  25  | // TOKEN
  26  | // =============================================================
  27  | 
  28  | const TOKEN_FILE = path.resolve('.auth/token.json');
  29  | let cachedToken = null;
  30  | 
  31  | function readSavedToken() {
  32  |   if (cachedToken) return cachedToken;
  33  |   if (!fs.existsSync(TOKEN_FILE)) {
  34  |     throw new Error('❌ Missing .auth/token.json');
  35  |   }
  36  |   const { token } = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  37  |   if (!token) throw new Error('❌ Empty token in token.json');
  38  |   cachedToken = token;
  39  |   return cachedToken;
  40  | }
  41  | 
  42  | // =============================================================
  43  | // SHARED WORKER‑SCOPED PAGE (token injected once)
  44  | // =============================================================
  45  | 
  46  | let sharedPage = null;
  47  | let sharedContext = null;
  48  | 
  49  | // =============================================================
  50  | // FIXTURES
  51  | // =============================================================
  52  | 
> 53  | export const test = base.extend({
      |                          ^ Fixture "sharedPage" timeout of 30000ms exceeded during setup.
  54  | 
  55  |   baseAPI: [async ({}, use) => {
  56  |     const token = readSavedToken();
  57  |     console.log(`🔐 baseAPI token length: ${token.length}`);
  58  |     const api = new BaseAPI({ logger: console });
  59  |     await api.init(token);
  60  |     if (!api.token) api.setToken(token);
  61  |     await use(api);
  62  |     await api.requestContext?.dispose();
  63  |   }, { scope: 'worker' }],
  64  | 
  65  |   segmentAPI: [async ({ baseAPI }, use) => {
  66  |     await use(new SegmentAPI(baseAPI));
  67  |   }, { scope: 'worker' }],
  68  | 
  69  |   builder: [async ({ }, use, testInfo) => {
  70  |     const token = readSavedToken();
  71  |     const service = new SegmentBuilderService({
  72  |       logger: console,
  73  |       config: testInfo.project?.use?.builderConfig ?? {},
  74  |       token,
  75  |     });
  76  |     await service.init();
  77  |     testInfo.annotations.push(schemaAnnotation(service.schemaHash));
  78  |     await use(service);
  79  |     await service.dispose();
  80  |   }, { scope: 'test' }],
  81  | 
  82  |    dbClient: [async ({}, use) => {
  83  |      const client = {query};
  84  |      await use(client);
  85  |      }, { scope: 'worker' }],
  86  | 
  87  |   // New worker‑scoped shared page – avoids conflict with built‑in 'page'
  88  |   sharedPage: [async ({ browser }, use) => {
  89  |     if (!sharedPage) {
  90  |       console.log('\n🔐 [Worker] Initialising shared page – token injection once');
  91  |       const token = readSavedToken();
  92  |       const baseURL = (process.env.BASE_URL ?? 'http://3.216.34.218:9192/picr').replace(/\/$/, '');
  93  |       sharedContext = await browser.newContext();
  94  |       sharedPage = await sharedContext.newPage();
  95  |       //inject token before page loads app
  96  |       await sharedPage.addInitScript((jwt) => {
  97  |         sessionStorage.setItem('auth_token', jwt);
  98  |         sessionStorage.setItem('token', jwt);
  99  |         sessionStorage.setItem('access_token', jwt);
  100 |       }, token);
  101 | 
  102 |       await sharedPage.goto(`${baseURL}/dashboard/portfolio-overview`, {
  103 |         waitUntil: 'domcontentloaded',
  104 |         timeout: 60000,
  105 |       });
  106 | 
  107 |       await sharedPage.locator('text=Portfolio Overview').waitFor({
  108 |         state: 'visible',
  109 |         timeout: 30000,
  110 |       });
  111 | 
  112 |       console.log('AFTER AUTH FLOW (worker):', sharedPage.url());
  113 | 
  114 |       if (sharedPage.url().includes('/login')) {
  115 |         throw new Error('❌ Authentication failed after injection');
  116 |       }
  117 |     } else {
  118 |       console.log('♻️ [Worker] Reusing existing authenticated page');
  119 |     }
  120 |     await use(sharedPage);
  121 |   }, { scope: 'worker' }],
  122 | });
  123 | 
  124 | export { expect };
```