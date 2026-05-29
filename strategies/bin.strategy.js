// strategies/bin.strategy.js

export class BinStrategy {
  constructor(
    { numeric = [], categorical = [] },
    {
      config = {},
      logger = null
    } = {}
  ) {
    this.numeric = numeric;
    this.categorical = categorical;

    this.logger = logger;

    this.numericBins = config.numericBins || 3;
    this.categoricalTopN = config.categoricalTopN || 5;
    this.maxBins = config.maxBins || 10;
    this.enableAudit = config.enableAudit ?? true;

    this.distinctValuesMap = config.distinctValuesMap || {};
    this.selectedValuesMap = config.selectedValuesMap || null;
  }

  // =========================================================
  // MAIN ENTRY
  // =========================================================
  build() {
    const audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `run-${Date.now()}`,

      timestamp: new Date().toISOString(),

      numeric: [],
      categorical: [],
      numericCount: this.numeric.length,
      categoricalCount: this.categorical.length
    };

    if (!this.numeric.length && !this.categorical.length) {
      this.logger?.warn?.({
         type: 'EMPTY_SCHEMA_BINNING', 
         runId: audit.runId
         });
      return {
        numeric: [],
        categorical: [],
        audit: this.enableAudit ? audit : undefined
      };
    }

    const numeric = this.buildNumericBins(audit);
    const categorical = this.buildCategoricalBins(audit);

    return {
      numeric,
      categorical,
      audit: this.enableAudit ? audit : undefined
    };
  }

  // =========================================================
  // NUMERIC BINNING
  // =========================================================
  buildNumericBins(audit) {
    if (!this.numeric.length) return [];

    return this.numeric.map(attr => {
      if (!attr || !attr.name) {
        this.logger?.error?.({ 
          type: 'INVALID_NUMERIC_ATTRIBUTE' 
        });
        return null;
      }

      const binCount = this.resolveBinCount(attr);
      const bins = this.generateEqualWidthBins(binCount);

      if (this.enableAudit) {
        audit.numeric.push({
          name: attr.name,
          binCount,
          strategy: 'equal_width'
        });
      }

      return { name: attr.name, type: 'numeric', bins };
    }).filter(Boolean);
  }

  // =========================================================
  // CATEGORICAL BINNING
  // =========================================================
  buildCategoricalBins(audit) {
    if (!this.categorical.length) return [];

    return this.categorical.map(attr => {
      if (!attr || !attr.name) {
        this.logger?.warn?.({ type: 'INVALID_CATEGORICAL_ATTRIBUTE' });
        return null;
      }

      const attrName = attr.name;

      // STEP 1: get distinct values
      let values = this.distinctValuesMap[attrName] || [];

      if (!Array.isArray(values) || values.length === 0) {
        this.logger?.warn?.({ type: 'NO_DISTINCT_VALUES', field: attrName });
        values = [];
      }

      // normalize — remove null/undefined/duplicates
      values = [...new Set(values.filter(v => v !== null && v !== undefined))];

      // STEP 2: apply UI filter if selectedValuesMap provided
      if (this.selectedValuesMap && this.selectedValuesMap[attrName]) {
        const selectedSet = new Set(this.selectedValuesMap[attrName]);
        values = values.filter(v => selectedSet.has(v));
      }

      if (values.length === 0) {
        this.logger?.warn?.({ type: 'EMPTY_AFTER_FILTER', field: attrName });
      }

      // skip columns with no distinct values — empty bins would throw downstream
      if (values.length === 0) return null;

      // STEP 3: limit safely
      const bins = values.slice(0, this.categoricalTopN);

      if (this.enableAudit) {
        audit.categorical.push({
          name: attrName,
          totalDistinct: values.length,
          returned: bins.length,
          strategy: 'distinct_values_filtered'
        });
      }

      return { name: attrName, type: 'categorical', bins };
    }).filter(Boolean);
  }

  // =========================================================
  // BIN COUNT RESOLUTION
  // CHANGE: replaced `this.random(2)` with plain Math.random() call —
  // the old method checked `this.seed !== null` and fell through to
  // Math.random() anyway (seed was always null). Method is now removed.
  // =========================================================
  resolveBinCount(attr) {
    const base = this.numericBins;
    const variation = Math.floor(Math.random() * 2); // 0 or 1
    const count = Math.min(base + variation, this.maxBins);
    return Math.max(2, count);
  }

  // =========================================================
  // EQUAL WIDTH BIN GENERATOR
  // Generates bins from 0–100 as normalized percentile ranges.
  // For real column ranges, pass min/max via attr when available.
  // =========================================================
  generateEqualWidthBins(count) {
    const bins = [];
    const step = 100 / count;

    for (let i = 0; i < count; i++) {
      // floor for min, floor for max — prevents adjacent bin overlap
      const min = i === 0 ? 0 : Math.floor(i * step) + 1;
      const max = i === count - 1 ? 100 : Math.floor((i + 1) * step);
      bins.push({ min, max });
    }

    return bins;
  }

  // CHANGE: removed `random()` method entirely — it was only used in
  // `resolveBinCount()` and is replaced by inline Math.random() there.
  // The seed branch inside it was dead code since seed was always null.

  // CHANGE: removed `resetSeed()` — no seed state exists to reset
}