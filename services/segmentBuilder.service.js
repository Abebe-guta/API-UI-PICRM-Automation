// =============================================================
// services/segmentBuilder.service.js
// PURPOSE: Orchestration engine
// =============================================================

import { normalizeSchema }             from '../Domain/schema/schema.normalizer.js';
import { SchemaResolver }              from '../Domain/schema/schema.resolver.js';
import { AttributeSelector }           from '../strategies/attribute.selector.js';
import { BinStrategy }                 from '../strategies/bin.strategy.js';
import { MetricSelector }              from '../strategies/metric.selector.js';
import { SegmentModel }                from '../Domain/segment/segment.model.js';
import { TableResolver }               from '../API/resolver/table.resolver.js';
import { ColumnsAPI }                  from '../API/columns.api.js';
import { BaseAPI }                     from '../API/base.api.js';
import { hashObject, formatTimestamp } from '../utils/helpers.js';
import { readFileSync }                from 'fs';
import path                            from 'path';
import { fileURLToPath }               from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const WHITELIST_PATH = path.resolve(__dirname, '../utils/metrics-config.json');

export class SegmentBuilderService {

  constructor({
    logger = console,
    config = {},
    token  = null,
  } = {}) {
    this.logger = logger;
    this.config = config;
    this._token = token;

    this.baseAPI    = new BaseAPI({ logger });
    this.columnsAPI = new ColumnsAPI(this.baseAPI);

    this.table             = null;
    this.columns           = [];
    this.schemaHash        = null;
    this.distinctValuesMap = {};
    this.selectedValuesMap = null;

    this._initialized = false;
  }

  // ============================================================
  // INIT
  // ============================================================
  async init() {
    await this.baseAPI.init();

    if (this._token) {
      this.baseAPI.setToken(this._token);
    }

    // STEP 0: TABLE SELECTION
    const rawTableResponse = await this.columnsAPI.getLoanDataTables();

    const rawList = rawTableResponse?.tables ?? rawTableResponse;
    const tables  = Array.isArray(rawList)
      ? rawList.map(t => (typeof t === 'string' ? { name: t } : t))
      : [];

    const tableResolver  = new TableResolver({ logger: this.logger });
    const selectedTable  = tableResolver.selectTable(tables);

    this.table = selectedTable.name;

    // STEP 1: FETCH COLUMNS
    const columnsResult = await this.columnsAPI.getColumns(this.table);

    const usableColumns = columnsResult?.usable ?? columnsResult;

    if (!Array.isArray(usableColumns) || usableColumns.length === 0) {
      throw new Error(`❌ No usable columns returned for table: ${this.table}`);
    }

    this.columns = normalizeSchema(usableColumns);

    if (this.columns.length === 0) {
      throw new Error(`❌ No columns survived normalization for table: ${this.table}`);
    }

    this.schemaHash   = hashObject(this.columns);
    this._initialized = true;

    this.logger?.info?.({
      type:       'SERVICE_INITIALIZED',
      table:      this.table,
      columns:    this.columns.length,
      schemaHash: this.schemaHash
    });
  }

  // ============================================================
  // BUILD
  // ============================================================
  async build() {
    if (!this._initialized) {
      throw new Error('❌ Call init() before build()');
    }

    const audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `run-${Date.now()}`,

      timestamp:         new Date().toISOString(),
      builtAt:           formatTimestamp(),
      schemaFingerprint: this.schemaHash,
      table:             this.table,
      steps: {
        tableSelection: {
          selected:     this.table,
          totalColumns: this.columns.length,
          mode: 'random'
        }
      }
    };

    try {
      // STEP 2: SCHEMA RESOLUTION
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
      audit.steps.AttributeSelector = attrAudit;

      if (!selectedNumeric.length && !selectedCategorical.length) {
        throw new Error('❌ No attributes selected');
      }

      // STEP 4a: FETCH DISTINCT VALUES for selected categorical columns
      const fetchedDistinctValues = { ...this.distinctValuesMap };

      for (const col of selectedCategorical) {
        if (!fetchedDistinctValues[col.name]) {
          try {
            const result = await this.columnsAPI.getDistinctValues({
              table_name:  this.table,
              column_name: col.name,
              limit:       100,
            });
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

      // STEP 4b: BINNING
      const binStrategy = new BinStrategy(
        { numeric: selectedNumeric, categorical: selectedCategorical },
        {
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

      audit.steps.binning = binAudit;

      if (!numericBins.length && !categoricalBins.length) {
        throw new Error('❌ No bins generated — no numeric or categorical bins available');
      }

      // STEP 5: METRIC SELECTION
      const numericSchema = schema.filter(c => c.type === 'numeric');
      if (!numericSchema.length) throw new Error('❌ No numeric columns available for metrics');

      let allowedMetrics = null;
      try {
        const whitelistMetrics = JSON.parse(readFileSync(WHITELIST_PATH, 'utf-8'));
        allowedMetrics = whitelistMetrics[this.table] || null;
        if (allowedMetrics?.length) {
          this.logger?.info?.({
            type:  'METRIC_WHITELIST_LOADED',
            table: this.table,
            count: allowedMetrics.length
          });
        }
      } catch (err) {
        this.logger?.warn?.({ type: 'METRIC_WHITELIST_FAILED', error: err.message });
      }
      const metricSelector = new MetricSelector(
        numericSchema,
        {
          logger: this.logger,
          config: {
            ...this.config,
            allowedMetrics
          }
        }
      );

      const { metrics, audit: metricAudit } = metricSelector.select(
        this.config.metricsCount || 1
      );
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
      const payload = segment.buildPayload();

      const _meta = {
        schemaHash: this.schemaHash,
        table:      this.table,
        builtAt:    audit.builtAt,
        runId:      audit.runId
      };

      return { ...payload, _meta, serviceAudit: audit };

    } catch (error) {
      this.logger?.error?.({
        type:    'SEGMENT_BUILD_FAILED',
        message: error.message,
        runId:   audit.runId,
        table:   this.table
      });
      throw error;
    }
  }

  // ============================================================
  // DISPOSE
  // ============================================================
  async dispose() {
    try {
      await this.baseAPI.requestContext?.dispose();
    } catch { /* silent */ }
  }

  // ============================================================
  // TEST SUPPORT
  // ============================================================
  setDistinctValuesMap(map) {
    this.distinctValuesMap = map;
  }

  snapshot() {
    return {
      table:      this.table,
      schemaHash: this.schemaHash,
      columns:    this.columns.length,
      config:     { ...this.config }
    };
  }
}