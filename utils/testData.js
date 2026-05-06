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


// -------------------------------------------------------------
// DEFAULT CONFIG
// -------------------------------------------------------------
export const DEFAULT_CONFIG = Object.freeze({
  timeoutMs: 30000,
  retryAttempts: 3,
  retryDelayMs: 500,
  previewRowLimit: 100,
  maxConditions: 10,
  defaultSeed: 42,
});


// -------------------------------------------------------------
// COLUMN TYPES (aligned with schema.normalizer.js)
// -------------------------------------------------------------
export const COLUMN_TYPES = Object.freeze({
  NUMERIC: 'numeric',
  CATEGORICAL: 'categorical',
  DATE: 'date',
});


// -------------------------------------------------------------
// OPERATORS (used in validation/tests only)
// -------------------------------------------------------------
export const OPERATORS_BY_TYPE = Object.freeze({
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
});


// -------------------------------------------------------------
// MOCK SCHEMA (STRUCTURE ONLY — NO RULES)
// -------------------------------------------------------------
export const MOCK_SCHEMA = Object.freeze({
  tableName: 'mock_customers',
  schemaHash: 'fallback00',

  columns: [
    { name: 'customer_id', type: COLUMN_TYPES.NUMERIC },
    { name: 'full_name', type: COLUMN_TYPES.CATEGORICAL },
    { name: 'email', type: COLUMN_TYPES.CATEGORICAL },
    { name: 'age', type: COLUMN_TYPES.NUMERIC },
    { name: 'country', type: COLUMN_TYPES.CATEGORICAL },
    { name: 'is_active', type: COLUMN_TYPES.CATEGORICAL },
    { name: 'signup_date', type: COLUMN_TYPES.DATE },
    { name: 'total_spend', type: COLUMN_TYPES.NUMERIC },
    { name: 'order_count', type: COLUMN_TYPES.NUMERIC },
    { name: 'segment_tag', type: COLUMN_TYPES.CATEGORICAL },
  ],
});


// -------------------------------------------------------------
// FALLBACK PAYLOAD FACTORY (SAFE + DETERMINISTIC)
// -------------------------------------------------------------
export function createFallbackPayload({
  seed = DEFAULT_CONFIG.defaultSeed,
  schemaHash = MOCK_SCHEMA.schemaHash,
  tableName = MOCK_SCHEMA.tableName,
} = {}) {

  const builtAt = new Date().toISOString();

  return {
    config: {
      table_name: tableName,

      attributes: [
        {
          column_name: 'age',
          mode: 'bins',
          numeric_bins: [
            { min: 18, max: 40, label: '18-40' },
            { min: 41, max: 65, label: '41-65' },
            { min: 66, max: 90, label: '66-90' },
          ]
        },
        {
          column_name: 'country',
          mode: 'distinct_values',
          selected_values: ['US', 'UK', 'ET']
        }
      ],

      derived_columns: null,

      target_metrics: [
        {
          column_name: 'total_spend',
          aggregation: 'AVG'
        }
      ],
    },

    _meta: {
      seed,
      seedEnd: seed,
      schemaHash,
      table: tableName,
      source: 'fallback',
      reproducible: true,
      builtAt,
      replayCommand: `SEED=${seed} npx playwright test`
    }
  };
}


// -------------------------------------------------------------
// MOCK API RESPONSES (CONTRACT-ALIGNED)
// -------------------------------------------------------------
export const MOCK_RESPONSES = Object.freeze({

  segmentCreated: {
    id: 'seg_mock_001',
    name: 'Mock Segment',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
  },

  previewResult: {
    data: [],
    total_records: 0
  },

  columnsList: {
    all: MOCK_SCHEMA.columns,
    usable: MOCK_SCHEMA.columns
  },

  errorUnauthorized: {
    status: 401,
    error: 'Unauthorized',
    message: 'Missing or invalid token',
  },

  errorValidation: {
    status: 422,
    error: 'Unprocessable Entity',
    message: 'Invalid segment conditions',
  },

});


// -------------------------------------------------------------
// NAME FACTORIES
// -------------------------------------------------------------
export function buildSegmentName(tableName, seed, runLabel = '') {
  return `AutoSeg_${tableName}_${runLabel}_seed${seed}`;
}

export function buildSegmentDescription(tableName, seed, schemaHash) {
  return (
    `Auto-generated segment for table "${tableName}". ` +
    `Seed=${seed}. Schema=${schemaHash}. ` +
    `Replay: SEED=${seed} npx playwright test`
  );
}


// -------------------------------------------------------------
// TEST ANNOTATIONS (PLAYWRIGHT)
// -------------------------------------------------------------
export function seedAnnotation(seed) {
  return { type: 'seed', description: String(seed) };
}

export function schemaAnnotation(schemaHash) {
  return { type: 'schemaHash', description: schemaHash };
}


// -------------------------------------------------------------
// LIGHTWEIGHT VALIDATION HELPERS (NO BUSINESS RULES)
// -------------------------------------------------------------
export function validateColumn(column) {
  const issues = [];

  if (!column?.name) {
    issues.push('Missing column name');
  }

  if (!column?.type && !column?.type_category) {
    issues.push(`Missing type for column: ${column?.name}`);
  }

  const type = column.type_category || column.type;

  if (type && !Object.values(COLUMN_TYPES).includes(type)) {
    issues.push(`Invalid type "${type}" for ${column?.name}`);
  }

  if (column.name && !/^[a-z0-9_]+$/.test(column.name)) {
    issues.push(`Non-normalized column name: ${column.name}`);
  }

  return issues;
}

export function validateSchema(columns = []) {
  const errors = [];
  const seen = new Set();

  for (const col of columns) {
    if (seen.has(col.name)) {
      errors.push(`Duplicate column: ${col.name}`);
    }
    seen.add(col.name);

    errors.push(...validateColumn(col));
  }

  return errors;
}