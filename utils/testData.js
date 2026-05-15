// =============================================================
// utils/testData.js (FINAL - ENTERPRISE READY)
// PURPOSE: Static configs, factories, validation helpers
// RULE   : No orchestration / no business logic
// =============================================================


// -------------------------------------------------------------
// ENV (STRICT VALIDATION)
// -------------------------------------------------------------
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required env var: ${name}`);
  }
  return value;
}

export const ENV = {
  BASE_URL: requireEnv('BASE_URL'),
  USERNAME: requireEnv('LOGIN_USERNAME'),
  PASSWORD: requireEnv('LOGIN_PASSWORD'),
};


// =============================================================
// utils/testData.js
// LAYER  : Utils — mock inputs, fallback data, default configs
// RULE   : NO business logic. Pure static data + simple factories.
// USED BY: fixtures/, tests/, segmentBuilder.service.js
//
// WHY THIS FILE EXISTS:
//   Centralises every "magic value" in the test suite. If the
//   API changes a field name or a default limit, you change it
//   here once — not scattered across 10 test files.
// =============================================================

// -------------------------------------------------------------
// DEFAULT CONFIGS
//
// WHY centralise timeouts and limits?
//   Playwright's default timeout is 30s. Our API can be slow on
//   cold starts. Having one place to bump `timeoutMs` means a
//   single PR fixes every test instead of a grep-and-replace.
// -------------------------------------------------------------

export const DEFAULT_CONFIG = {
  timeoutMs:       30_000,  // global API + UI wait timeout
  retryAttempts:   3,       // passed to utils/helpers retry()
  retryDelayMs:    500,     // ms between retries
  previewRowLimit: 100,     // max rows we request in preview
  maxConditions:   10,      // segment model safety cap
  defaultSeed:     42,      // used when SEED env var is absent
                            // 42 is arbitrary but stable — do not
                            // change without updating CI baselines
};


// -------------------------------------------------------------
// COLUMN TYPE CONSTANTS
//
// WHY constants instead of raw strings?
//   'numeric' typed in 3 files = 3 places to fix if backend
//   renames it to 'number'. Constants = one place to fix.
//   These must mirror what schema.normalizer.js produces.
// -------------------------------------------------------------

export const COLUMN_TYPES = {
  NUMERIC:     'numeric',
  CATEGORICAL: 'categorical',
  DATE:        'date',
};


// -------------------------------------------------------------
// OPERATOR MAP
//
// WHY here and not in the strategies?
//   Strategies select columns — they don't build query operators.
//   Tests need this map to assert that generated payloads only
//   use valid operators. Centralising it avoids duplication
//   between the strategy layer and the test layer.
// -------------------------------------------------------------

export const OPERATORS_BY_TYPE = {
  [COLUMN_TYPES.NUMERIC]: [
    'equals', 'not_equals', 'greater_than',
    'less_than', 'between', 'is_null', 'is_not_null'
  ],
  [COLUMN_TYPES.CATEGORICAL]: [
    'equals', 'not_equals', 'in',
    'not_in', 'is_null', 'is_not_null'
  ],
  [COLUMN_TYPES.DATE]: [
    'equals', 'before', 'after',
    'between', 'is_null', 'is_not_null'
  ],
};


// -------------------------------------------------------------
// MOCK SCHEMA
//
// WHY a mock schema?
//   Unit tests for strategies and the segment model should not
//   hit the real API. This mock produces the same shape as
//   schema.normalizer.js so strategies behave identically.
//
// WHY these specific columns?
//   They cover all three types (numeric / categorical / date)
//   and include edge cases: nullable fields, metric-eligible
//   fields, and an enum-style categorical. This exercises the
//   full branching logic in attribute.selector and bin.strategy.
// -------------------------------------------------------------

export const MOCK_SCHEMA = {
  tableName:  'mock_customers',
  schemaHash: 'fallback00',  // static hash — never changes for this mock
  columns: [
    // numeric — not a metric (id-like, not aggregatable)
    { name: 'customer_id',  type: COLUMN_TYPES.NUMERIC,     nullable: false },

    // categorical — high-cardinality string
    { name: 'full_name',    type: COLUMN_TYPES.CATEGORICAL,  nullable: false },

    // categorical — email (blocked field — should never appear in payloads)
    { name: 'email',        type: COLUMN_TYPES.CATEGORICAL,  nullable: true  },

    // numeric — metric-eligible, has a real-world range
    { name: 'age',          type: COLUMN_TYPES.NUMERIC,      nullable: true,
      range: { min: 18, max: 90 } },

    // categorical — enum-style, small cardinality
    { name: 'country',      type: COLUMN_TYPES.CATEGORICAL,  nullable: true,
      values: [ 'ET'] },

    // categorical — boolean stored as string (common in loan data)
    { name: 'is_active',    type: COLUMN_TYPES.CATEGORICAL,  nullable: false },

    // date — used for time-based segmentation
    { name: 'signup_date',  type: COLUMN_TYPES.DATE,         nullable: true  },

    // numeric — key metric for loan/CRM use case
    { name: 'total_spend',  type: COLUMN_TYPES.NUMERIC,      nullable: true,
      range: { min: 0, max: 50000 } },

    // numeric — another key metric
    { name: 'order_count',  type: COLUMN_TYPES.NUMERIC,      nullable: true,
      range: { min: 0, max: 500 } },

    // categorical — segment tag (low cardinality enum)
    { name: 'segment_tag',  type: COLUMN_TYPES.CATEGORICAL,  nullable: true,
      values: ['vip', 'standard', 'at_risk', 'new'] },
  ],
};


// -------------------------------------------------------------
// FALLBACK SEGMENT PAYLOAD
//
// WHY a fallback payload?
//   If segmentBuilder.service fails to build dynamically (e.g.
//   the API is down during a test run), tests that only care about
//   contract shape — not content — can still proceed using this.
//   It means a network outage doesn't wipe out the entire suite.
//
// _meta.source: 'fallback' lets the audit logger flag this run
//   as non-deterministic so it's excluded from compliance reports.
// -------------------------------------------------------------

export const FALLBACK_SEGMENT_PAYLOAD = {
  config: {
    table_name:     'mock_customers',
    attributes: [
      {
        column_name:  'age',
        mode:         'bins',
        numeric_bins: [
          { min: 18, max: 40, label: '18-40' },
          { min: 41, max: 65, label: '41-65' },
          { min: 66, max: 90, label: '66-90' },
        ]
      },
      {
        column_name:    'country',
        mode:           'distinct_values',
        selected_values: ['US', 'UK', 'ET']
      }
    ],
    derived_columns: null,
    target_metrics: [
      { column_name: 'total_spend', aggregation: 'AVG' }
    ],
  },
  _meta: {
    seed:          DEFAULT_CONFIG.defaultSeed,
    schemaHash:    MOCK_SCHEMA.schemaHash,
    source:        'fallback',   // ← signals this was not dynamically built
    reproducible:  true,
    builtAt:       null,         // filled at runtime so it's always accurate
    replayCommand: `SEED=${DEFAULT_CONFIG.defaultSeed} npx playwright test`
  },
};


// -------------------------------------------------------------
// MOCK API RESPONSES
//
// WHY mock responses?
//   Contract tests verify the validator logic, not the real API.
//   Using these mocks means contract tests run instantly (no HTTP)
//   and remain stable even when the backend is broken.
//
// Shape rule: every mock response must pass through the matching
//   contract validator (validateCreateSegmentResponse, etc.) without
//   throwing — if it doesn't, the mock is wrong, not the validator.
// -------------------------------------------------------------

export const MOCK_RESPONSES = {

  // Shape: validateCreateSegmentResponse checks id + optional name/created_at
  segmentCreated: {
    id:         'seg_mock_001',    // string id — passes isValidId()
    name:       'Mock Segment',
    status:     'active',
    created_at: '2024-01-01T00:00:00.000Z',  // ISO — passes isValidDate()
  },

  // Shape: validatePreviewResponse checks data[] + optional total_records
  previewResult: {
    data:          [],             // empty array — contract warns but doesn't throw
    total_records: 0,
    // NOTE: contract checks data.data not data.totalRows — field is `data`
  },

  // Shape: validateColumnsResponse returns { all: [], usable: [] }
  columnsList: {
    all:    MOCK_SCHEMA.columns,
    usable: MOCK_SCHEMA.columns.filter(c =>
      [COLUMN_TYPES.NUMERIC, COLUMN_TYPES.CATEGORICAL].includes(c.type)
    ),
  },

  // Shape: 401 error — matches BaseAPI error structure
  errorUnauthorized: {
    status:  401,
    error:   'Unauthorized',
    message: 'Missing or invalid token',
  },

  // Shape: 422 error — validation failure from segment API
  errorValidation: {
    status:  422,
    error:   'Unprocessable Entity',
    message: 'Invalid segment conditions',
  },
};


// -------------------------------------------------------------
// SEGMENT NAME / DESCRIPTION FACTORIES
//
// WHY factories instead of inline string templates in tests?
//   Three reasons:
//   1. Traceability — every auto-generated segment has the seed
//      embedded so you can grep the DB for 'AutoSeg_*_seed42'
//   2. Uniqueness — seed + tableName combination is unique per run
//      preventing false positives when checking getSegments()
//   3. Single source — if the naming convention changes, you
//      update one function, not every test file
// -------------------------------------------------------------

/**
 * Build a traceable segment name.
 * e.g. buildSegmentName('loan_data', 42) → 'AutoSeg_loan_data_seed42'
 *
 * @param {string}        tableName
 * @param {number|string} seed
 */
export function buildSegmentName(tableName, seed) {
  const cleanTable = String(tableName).trim().replace(/_+$/, '');
  // Timestamp suffix guarantees uniqueness across runs
  // Seed is tracked separately in the Playwright report + audit log
  const shortTs = String(Date.now()).slice(-6);
  return `Seg_${cleanTable}_${shortTs}`;
}

/**
 * Build a segment description with full run metadata.
 * This appears in the UI and in the API response — makes the
 * segment self-documenting for compliance auditors.
 *
 * @param {string}        tableName
 * @param {number|string} seed
 * @param {string}        schemaHash
 */
export function buildSegmentDescription(tableName, seed, schemaHash) {
  return (
    `Auto-generated segment for table "${tableName}". ` +
    `Seed: ${seed}. Schema: ${schemaHash}. ` +
    `Replayable with: SEED=${seed} npx playwright test`
  );
}


// -------------------------------------------------------------
// PLAYWRIGHT TEST ANNOTATION HELPERS
//
// WHY annotation helpers?
//   Playwright's HTML report shows `testInfo.annotations` as
//   labelled badges on each test. By using these helpers:
//   - Every test gets a consistent 'seed' badge
//   - Every test gets a consistent 'schemaHash' badge
//   - You can filter the report by seed to find related failures
//   - CI can parse annotations to group failures by schema version
//
// Usage: testInfo.annotations.push(seedAnnotation(seed))
// -------------------------------------------------------------

/**
 * Playwright annotation for the seed used in this run.
 * Renders as: [seed] 42
 * @param {number|string} seed
 */
export function seedAnnotation(seed) {
  return { type: 'seed', description: String(seed) };
}

/**
 * Playwright annotation for the schema hash.
 * Renders as: [schemaHash] 3fa2c10b
 * Useful to correlate failures across runs on the same schema.
 * @param {string} schemaHash
 */
export function schemaAnnotation(schemaHash) {
  return { type: 'schemaHash', description: schemaHash };
}