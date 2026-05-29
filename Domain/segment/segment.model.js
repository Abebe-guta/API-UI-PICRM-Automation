// domain/segment.model.js

const VALID_MODES = Object.freeze(['bins', 'distinct_values']);

export class SegmentModel {
  constructor(
    { table, schema = [] },
    {
      logger = null,
      configVersion = 'v1'
    } = {}
  ) {
    if (!table || typeof table !== 'string') {
      throw new Error('❌ Segment must have a valid table');
    }

    this.table = table.trim();

    this.schema = schema;
    this.schemaMap = new Map(schema.map(c => [c.name, c.type]));
    this.schemaSet = new Set(schema.map(c => c.name));

    this.attributes = [];
    this.targetMetrics = [];

    this.logger = logger;

    this.audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `run-${Date.now()}`,

      // CHANGE: was Date.now() (raw integer) — aligned to ISO string
      // to match timestamp format used everywhere else in the codebase
      timestamp: new Date().toISOString(),

      table: this.table,
      configVersion,
      schemaSize: schema.length,
      attributes: [],
      metrics: []
    };
  }

  // =========================================================
  // ATTRIBUTE VALIDATION
  // =========================================================
  validateAttribute(attr) {
    if (
      !attr?.column_name ||
      typeof attr.column_name !== 'string' ||
      !attr.column_name.trim()
    ) {
      throw new Error('❌ Attribute missing valid column_name');
    }

    const columnName = attr.column_name.trim();

    if (!this.schemaSet.has(columnName)) {
      throw new Error(`❌ Column not found in schema: ${columnName}`);
    }

    const columnType = this.schemaMap.get(columnName);

    if (!VALID_MODES.includes(attr.mode)) {
      throw new Error(`❌ Invalid mode: ${attr.mode}`);
    }

    if (attr.mode === 'bins' && columnType !== 'numeric') {
      throw new Error(`❌ ${columnName} must be numeric for bins`);
    }

    if (attr.mode === 'distinct_values' && columnType !== 'categorical') {
      throw new Error(`❌ ${columnName} must be categorical for distinct_values`);
    }

    // -----------------------------
    // DISTINCT VALUES RULE
    // -----------------------------
    if (attr.mode === 'distinct_values') {
      if (!Array.isArray(attr.selected_values) || attr.selected_values.length === 0) {
        throw new Error(`❌ ${columnName} requires selected_values`);
      }

      // CHANGE: validation only — normalization moved to addAttribute()
      // so we never mutate the caller's object here.
      // Previously `attr.selected_values = normalizedValues` was a silent
      // side effect that modified the object passed in from binStrategy.build()
      // before it was frozen — caller had no visibility of the mutation.
      const normalizedValues = [...new Set(
        attr.selected_values
          .map(v => (typeof v === 'string' ? v.trim() : v))
      )];

      const invalidValue = normalizedValues.find(
        val => val === null || val === undefined || typeof val === 'object'
      );

      if (invalidValue !== undefined) {
        throw new Error(`❌ Invalid selected value in ${columnName}`);
      }

      // CHANGE: return normalized values instead of mutating attr
      return { columnName, normalizedValues };
    }

    // -----------------------------
    // BINS RULE
    // -----------------------------
    if (attr.mode === 'bins') {
      if (!Array.isArray(attr.numeric_bins) || attr.numeric_bins.length === 0) {
        throw new Error(`❌ ${columnName} requires numeric_bins`);
      }

      attr.numeric_bins.forEach((bin, index) => {
        if (typeof bin.min !== 'number' || typeof bin.max !== 'number') {
          throw new Error(`❌ Invalid bin structure at index ${index}`);
        }

        if (bin.min > bin.max) {
          throw new Error(`❌ Invalid bin range at index ${index}: min > max`);
        }

        if (!bin.label || typeof bin.label !== 'string') {
          throw new Error(`❌ Missing label in bin at index ${index}`);
        }
      });

      const sorted = [...attr.numeric_bins].sort((a, b) => a.min - b.min);

      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].min <= sorted[i - 1].max) {
          throw new Error(`❌ Overlapping bins in ${columnName}`);
        }
      }

      if (attr.numeric_bins.length > 50) {
        this.logger?.warn?.({
          type: 'EXCESSIVE_BIN_COUNT',
          column: columnName,
          count: attr.numeric_bins.length
        });
      }
    }

    return { columnName, normalizedValues: null };
  }

  // =========================================================
  // ADD ATTRIBUTE
  // =========================================================
  addAttribute(attr) {
    // CHANGE: validateAttribute() now returns { columnName, normalizedValues }
    // instead of mutating attr directly. normalizedValues is only set for
    // distinct_values mode — null for bins mode.
    const { columnName, normalizedValues } = this.validateAttribute(attr);

    const exists = this.attributes.find(
      a => a.column_name === columnName
    );

    if (exists) {
      throw new Error(`❌ Duplicate attribute: ${columnName}`);
    }

    // CHANGE: apply normalizedValues here when building the frozen object,
    // so the caller's original object is never touched
    const normalized = Object.freeze({
      ...attr,
      column_name: columnName,
      ...(normalizedValues !== null && { selected_values: normalizedValues })
    });

    this.attributes.push(normalized);

    this.audit.attributes.push({
      column: columnName,
      mode: attr.mode
    });
  }

  // =========================================================
  // ADD METRIC
  // =========================================================
  addMetric(metric) {
    if (
      !metric ||
      typeof metric !== 'object' ||
      !metric.column_name ||
      !metric.aggregation
    ) {
      throw new Error('❌ Metric must have column_name and aggregation');
    }

    const columnName = metric.column_name.trim();

    if (!this.schemaSet.has(columnName)) {
      throw new Error(`❌ Metric column not in schema: ${columnName}`);
    }

    const key = `${columnName}_${metric.aggregation}`;

    const exists = this.targetMetrics.find(
      m => `${m.column_name}_${m.aggregation}` === key
    );

    if (exists) {
      throw new Error(`❌ Duplicate metric: ${key}`);
    }

    const normalized = Object.freeze({
      column_name: columnName,
      aggregation: metric.aggregation
    });

    this.targetMetrics.push(normalized);

    this.audit.metrics.push(normalized);
  }

  // =========================================================
  // INTERNAL CONFIG BUILDER
  // =========================================================
  buildConfig() {
    return {
      table_name: this.table,

      // CHANGE: updated comment — sort is for consistent payload shape
      // regardless of insertion order, not "deterministic" in the seed sense
      attributes: [...this.attributes].sort((a, b) =>
        a.column_name.localeCompare(b.column_name)
      ),

      derived_columns: null,

      target_metrics: [...this.targetMetrics].sort((a, b) =>
        a.column_name.localeCompare(b.column_name)
      )
    };
  }

  // =========================================================
  // FINAL PAYLOAD
  // =========================================================
  buildPayload() {
    if (this.attributes.length === 0) {
      throw new Error('❌ At least one attribute required');
    }

    if (this.targetMetrics.length === 0) {
      throw new Error('❌ At least one metric required');
    }

    return {
      config: this.buildConfig(),
      audit: this.audit
    };
  }
}