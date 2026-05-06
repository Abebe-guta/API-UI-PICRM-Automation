// domain/segment.model.js

const VALID_MODES = Object.freeze(['bins', 'distinct_values']);

export class SegmentModel {
  constructor(
    { table, schema = [] }, // schema injected
    {
      logger = null,
      configVersion = 'v1'
    } = {}
  ) {
    if (!table || typeof table !== 'string') {
      throw new Error('❌ Segment must have a valid table');
    }

    this.table = table.trim();

    // schema awareness
    this.schema = schema;
    this.schemaMap = new Map(schema.map(c => [c.name, c.type]));
    this.schemaSet = new Set(schema.map(c => c.name));

    this.attributes = [];
    this.targetMetrics = [];

    this.logger = logger;

    // audit (aligned with your pipeline)
    this.audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

      timestamp: Date.now(),
      table: this.table,
      configVersion,

      schemaSize: schema.length,

      attributes: [],
      metrics: []
    };
  }

  // -----------------------------
  // ATTRIBUTE VALIDATION
  // -----------------------------
  validateAttribute(attr) {
    if (
      !attr?.column_name ||
      typeof attr.column_name !== 'string' ||
      !attr.column_name.trim()
    ) {
      throw new Error('❌ Attribute missing valid column_name');
    }

    const columnName = attr.column_name.trim();

    // schema existence validation
    if (!this.schemaSet.has(columnName)) {
      throw new Error(`❌ Column not found in schema: ${columnName}`);
    }

    const columnType = this.schemaMap.get(columnName);

    if (!VALID_MODES.includes(attr.mode)) {
      throw new Error(`❌ Invalid mode: ${attr.mode}`);
    }

    // type enforcement
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

      // normalize + dedupe values
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

      attr.selected_values = normalizedValues;
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

      // bin count safety
      if (attr.numeric_bins.length > 50) {
        this.logger?.warn?.({
          type: 'EXCESSIVE_BIN_COUNT',
          column: columnName,
          count: attr.numeric_bins.length
        });
      }
    }
  }

  // -----------------------------
  // ADD ATTRIBUTE
  // -----------------------------
  addAttribute(attr) {
    this.validateAttribute(attr);

    const normalizedName = attr.column_name.trim();

    const exists = this.attributes.find(
      a => a.column_name === normalizedName
    );

    if (exists) {
      throw new Error(`❌ Duplicate attribute: ${normalizedName}`);
    }

    const normalized = Object.freeze({
      ...attr,
      column_name: normalizedName
    });

    this.attributes.push(normalized);

    // audit tracking
    this.audit.attributes.push({
      column: normalizedName,
      mode: attr.mode
    });
  }

  // -----------------------------
  // METRICS (UPDATED STRUCTURE)
  // -----------------------------
  addMetric(metric) {
    // now expects structured metric
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

    // audit tracking
    this.audit.metrics.push(normalized);
  }

  // -----------------------------
  // INTERNAL CONFIG BUILDER
  // -----------------------------
  buildConfig() {
    return {
      table_name: this.table,

      // deterministic ordering
      attributes: [...this.attributes].sort((a, b) =>
        a.column_name.localeCompare(b.column_name)
      ),

      derived_columns: null,

      target_metrics: [...this.targetMetrics].sort((a, b) =>
        a.column_name.localeCompare(b.column_name)
      )
    };
  }

  // -----------------------------
  // FINAL PAYLOAD
  // -----------------------------
  buildPayload() {
    if (this.attributes.length === 0) {
      throw new Error('❌ At least one attribute required');
    }

    if (this.targetMetrics.length === 0) {
      throw new Error('❌ At least one metric required');
    }

    return {
      config: this.buildConfig(),

      //attach audit for traceability
      audit: this.audit
    };
  }
}