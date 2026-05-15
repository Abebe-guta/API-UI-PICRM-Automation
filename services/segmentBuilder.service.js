// =============================================================
// services/segmentBuilder.service.js
// PURPOSE: Orchestration engine — deterministic pipeline
//
// FIXES:
//   ✅ columnsAPI.getColumns() returns { all, usable }
//      → service now passes .usable to normalizeSchema()
//   ✅ async build()
//   ✅ this.baseAPI properly initialized
//   ✅ normalizeSchema() called as function not class
//   ✅ init() pre-fetches table + schema, exposes schemaHash
//   ✅ _meta block on every payload for replay
//   ✅ dispose() cleans up HTTP client
// =============================================================

import { normalizeSchema }          from '../Domain/schema/schema.normalizer.js';
import { SchemaResolver }           from '../Domain/schema/schema.resolver.js';
import { AttributeSelector }        from '../strategies/attribute.selector.js';
import { BinStrategy }              from '../strategies/bin.strategy.js';
import { MetricSelector }           from '../strategies/metric.selector.js';
import { SegmentModel }             from '../Domain/segment/segment.model.js';
import { TableResolver }            from '../api/resolver/table.resolver.js';
import { ColumnsAPI }               from '../api/columns.api.js';
import { BaseAPI }                  from '../api/base.api.js';
import { hashObject, formatTimestamp } from '../utils/helpers.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WHITELIST_PATH = path.resolve(__dirname, '../utils/metrics-config.json');

export class SegmentBuilderService {

  constructor({
    seed   = null,
    logger = console,
    config = {},
    token  = null,   // ← pre-saved token from globalSetup via fixture
                     //   injected AFTER init() boots the requestContext
  } = {}) {
    this.seed        = seed;
    this.initialSeed = seed;
    this.logger      = logger;
    this.config      = config;
    this._token      = token;  // stored, applied in init() after baseAPI.init()

    // BaseAPI manages its own requestContext (see base.api.js)
    this.baseAPI    = new BaseAPI({ logger });
    this.columnsAPI = new ColumnsAPI(this.baseAPI);

    // Populated by init()
    this.table             = null;
    this.columns           = [];      // normalized usable columns only
    this.schemaHash        = null;    // exposed for fixture annotation
    this.distinctValuesMap = {};
    this.selectedValuesMap = null;

    this._initialized = false;
  }

  // ============================================================
  // INIT
  // Pre-fetches table + schema so build() is purely deterministic.
  // Called once per test in base.fixture.js before test body runs.
  // ============================================================
  async init() {
    await this.baseAPI.init();

    // Inject the pre-saved token immediately after requestContext is ready.
    // WHY here and not in the constructor?
    //   requestContext doesn't exist until init() runs — setToken() just
    //   sets this.token on BaseAPI, which getHeaders() reads on every call.
    //   Calling it here guarantees every subsequent request is authenticated.
    if (this._token) {
      this.baseAPI.setToken(this._token);
    }

    // STEP 0: TABLE SELECTION
    const rawTableResponse = await this.columnsAPI.getLoanDataTables();

    // API returns: { success: true, tables: ['loan_table_coop'], message: '...' }
    // TableResolver expects objects: [{ name: 'loan_table_coop' }]
    // Extract .tables array and map strings → { name } objects
    const rawList = rawTableResponse?.tables ?? rawTableResponse;
    const tables  = Array.isArray(rawList)
      ? rawList.map(t => (typeof t === 'string' ? { name: t } : t))
      : [];

    const tableResolver = new TableResolver({ logger: this.logger });
    const selectedTable = tableResolver.selectTable(tables, { seed: this.seed });

    this.table = selectedTable.name;

    // STEP 1: FETCH COLUMNS
    // getColumns() returns { all, usable } via validateColumnsResponse()
    // We only pass .usable to normalizeSchema() — filtered + supported types only
    const columnsResult = await this.columnsAPI.getColumns(this.table);

    // FIX: columnsResult is { all, usable } — not a plain array
    // normalizeSchema() expects an array → pass .usable
    const usableColumns = columnsResult?.usable ?? columnsResult;

    if (!Array.isArray(usableColumns) || usableColumns.length === 0) {
      throw new Error(`❌ No usable columns returned for table: ${this.table}`);
    }

    // normalizeSchema expects { name, type } shaped items
    // columnsResult.usable items have: { name, type, isSupported, original }
    // → normalizeSchema handles this via its multiple field fallbacks
    this.columns = normalizeSchema(usableColumns);

    if (this.columns.length === 0) {
      throw new Error(`❌ No columns survived normalization for table: ${this.table}`);
    }

    // Schema fingerprint — exposed so fixture can annotate test report
    this.schemaHash = hashObject(this.columns);

    this._initialized = true;

    this.logger?.info?.({
      type:       'SERVICE_INITIALIZED',
      table:      this.table,
      columns:    this.columns.length,
      schemaHash: this.schemaHash,
      seed:       this.seed
    });
  }

  // ============================================================
  // BUILD 
  // ============================================================
  async build() {
    if (!this._initialized) {
      throw new Error('❌ Call init() before build()');
    }

    const seedStart = this.seed;

    const audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

      timestamp:         Date.now(),
      builtAt:           formatTimestamp(),
      seedStart,
      seedEnd:           null,
      schemaFingerprint: this.schemaHash,
      table:             this.table,

      steps: {
        tableSelection: {
          selected:     this.table,
          totalColumns: this.columns.length,
          mode:         this.seed !== null ? 'deterministic' : 'random'
        }
      }
    };

    try {
      // STEP 2: SCHEMA RESOLUTION
      // Pass already-normalized columns directly.
      // SchemaResolver calls normalizeSchema() internally — passing
      // pre-normalized columns avoids double-normalization which was
      // mutating the seed state and causing SEED_DRIFT warnings.
      // We bypass by passing { name, type } shaped items which
      // normalizeSchema() passes through unchanged (already valid).
      const resolver = new SchemaResolver(this.columns);
      const schema   = resolver.getUsableColumns();
      const stats    = resolver.getStats();

      audit.steps.schema = stats;

      // STEP 3: ATTRIBUTE SELECTION
      const attrSelector = new AttributeSelector(
        {
          numeric:     resolver.getNumeric(),
          categorical: resolver.getCategorical()
        },
        {
          seed:   this.seed,
          mode:   this.config.selectionMode || 'balanced',
          config: this.config,
          logger: this.logger
        }
      );

      const {
        numeric:     selectedNumeric,
        categorical: selectedCategorical,
        audit:       attrAudit
      } = attrSelector.select({
        numericCount:     this.config.numericCount     || 1,
        categoricalCount: this.config.categoricalCount || 1
      });

      this.seed = attrSelector.seed;
      audit.steps.AttributeSelector = attrAudit;

      if (!selectedNumeric.length && !selectedCategorical.length) {
        throw new Error('❌ No attributes selected');
      }

      // STEP 4a: FETCH DISTINCT VALUES for selected categorical columns
      // The distinctValuesMap must be populated BEFORE binning —
      // bin.strategy uses it to build selected_values for each categorical attr.
      // Without this, all categoricals get skipped (NO_DISTINCT_VALUES warning).
      const fetchedDistinctValues = { ...this.distinctValuesMap };

      for (const col of selectedCategorical) {
        if (!fetchedDistinctValues[col.name]) {
          try {
            const result = await this.columnsAPI.getDistinctValues({
              table_name:  this.table,
              column_name: col.name,
              limit:       100,
            });
            // getDistinctValues returns { values: [...], total }
            // values are already cleaned (nulls removed, deduped)
            fetchedDistinctValues[col.name] = result?.values ?? [];
          } catch (err) {
            this.logger?.warn?.({
              type:   'DISTINCT_VALUES_FETCH_FAILED',
              column: col.name,
              error:  err.message,
            });
            fetchedDistinctValues[col.name] = [];
          }
        }
      }

      // STEP 4: BINNING
      const binStrategy = new BinStrategy(
        { numeric: selectedNumeric, categorical: selectedCategorical },
        {
          seed:   this.seed,
          logger: this.logger,
          config: {
            ...this.config,
            distinctValuesMap: fetchedDistinctValues,
            selectedValuesMap: this.selectedValuesMap
          }
        }
      );

      const {
        numeric:     numericBins,
        categorical: categoricalBins,
        audit:       binAudit
      } = binStrategy.build();

      this.seed = binStrategy.seed;
      audit.steps.binning = binAudit;

      // only throw if BOTH are empty.
      // It's valid to have only numeric bins (no distinctValues for any categorical).
      // The segment model only requires at least one attribute total.
      if (!numericBins.length && !categoricalBins.length) {
        throw new Error('❌ No bins generated — no numeric or categorical bins available');
      }

      // STEP 5: METRIC SELECTION
      // Pass only numeric columns to MetricSelector
      // Prevents SUM/AVG/MIN/MAX being applied to categorical/text columns
      // which causes: "function sum(text) does not exist" backend error
      const numericSchema = schema.filter(c => c.type === 'numeric');
      if (!numericSchema.length) throw new Error('❌ No numeric columns available for metrics');

      let allowedMetrics=null;
      try {
        const whitelistMetrics = JSON.parse(readFileSync(WHITELIST_PATH, 'utf-8'));
        allowedMetrics = whitelistMetrics[this.table] || null;
        if (allowedMetrics && allowedMetrics.length) {
          this.logger?.info?.({ type: 'METRIC_WHITELIST_LOADED', table: this.table, count: allowedMetrics.length });
        }
      } catch (err) {
        this.logger?.warn?.({ type: 'METRIC_WHITELIST_FAILED', error: err.message });
      }

      const metricSelector = new MetricSelector(
        numericSchema,
        { seed: this.seed, 
          logger: this.logger, 
          config: {
            ...this.config ,
            allowedMetrics   // pass the whitelist (null = allow all)

          }
          }
      );

      const { metrics, audit: metricAudit } = metricSelector.select(
        this.config.metricsCount || 1
      );

      this.seed = metricSelector.seed;
      audit.steps.metrics = metricAudit;

      if (!metrics.length) {
        throw new Error('❌ No metrics selected');
      }

      // STEP 6: BUILD SEGMENT MODEL
      const segment = new SegmentModel(
        { table: this.table, schema },
        { logger: this.logger }
      );

      numericBins.forEach(attr => {
        segment.addAttribute({
          column_name:  attr.name,
          mode:         'bins',
          numeric_bins: attr.bins.map(b => ({ ...b, label: `${b.min}-${b.max}` }))
        });
      });

      categoricalBins.forEach(attr => {
        segment.addAttribute({
          column_name:     attr.name,
          mode:            'distinct_values',
          selected_values: attr.bins
        });
      });

      metrics.forEach(metric => segment.addMetric(metric));

      // STEP 7: FINALIZE
      audit.seedEnd = this.seed;

      const payload = segment.buildPayload();

      // _meta — attached to every payload for audit + replay
      const _meta = {
        seed:          seedStart,
        seedEnd:       this.seed,
        schemaHash:    this.schemaHash,
        table:         this.table,
        builtAt:       audit.builtAt,
        runId:         audit.runId,
        reproducible:  seedStart !== null,
        replayCommand: seedStart !== null
          ? `SEED=${seedStart} npx playwright test`
          : 'No seed — run is not reproducible'
      };

      return { ...payload, _meta, serviceAudit: audit };

    } catch (error) {
      this.logger?.error?.({
        type:    'SEGMENT_BUILD_FAILED',
        message: error.message,
        runId:   audit.runId,
        seed:    seedStart,
        table:   this.table
      });
      throw error;
    }
  }

  // ============================================================
  // DISPOSE — clean up HTTP client after tests
  // ============================================================
  async dispose() {
    try {
      await this.baseAPI.requestContext?.dispose();
    } catch { /* silent */ }
  }

  // ============================================================
  // TEST SUPPORT
  // ============================================================
  resetSeed() {
    this.seed = this.initialSeed;
  }

  setDistinctValuesMap(map) {
    this.distinctValuesMap = map;
  }

  snapshot() {
    return {
      table:      this.table,
      schemaHash: this.schemaHash,
      seed:       this.seed,
      columns:    this.columns.length,
      config:     { ...this.config }
    };
  }
}