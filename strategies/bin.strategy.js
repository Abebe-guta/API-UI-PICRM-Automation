// strategies/binning/bin.strategy.js

export class BinStrategy {
  constructor(
    { numeric = [], categorical = [] },
    {
      seed   = null,
      config = {},
      logger = null
    } = {}
  ) {
    this.numeric     = numeric;
    this.categorical = categorical;

    this.seed = seed;
    // FIX: was `this.intialSeed` (typo) → resetSeed() was setting seed to undefined
    this.initialSeed = seed;

    this.logger = logger;

    this.numericBins      = config.numericBins      || 3;
    this.categoricalTopN  = config.categoricalTopN  || 5;
    this.maxBins          = config.maxBins           || 10;
    this.enableAudit      = config.enableAudit       ?? true;

    this.distinctValuesMap = config.distinctValuesMap || {};
    this.selectedValuesMap = config.selectedValuesMap || null;
  }

  // -----------------------------
  // MAIN ENTRY
  // -----------------------------
  build() {
    const seedStart = this.seed;

    const audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      timestamp:        new Date().toISOString(),
      seedStart,
      seedEnd:          null,
      numeric:          [],
      categorical:      [],
      numericCount:     this.numeric.length,
      categoricalCount: this.categorical.length
    };

    if (!this.numeric.length && !this.categorical.length) {
      this.logger?.warn?.({ type: 'EMPTY_SCHEMA_BINNING', runId: audit.runId });
      return {
        numeric:     [],
        categorical: [],
        audit:       this.enableAudit ? audit : undefined
      };
    }

    const numeric     = this.buildNumericBins(audit);
    const categorical = this.buildCategoricalBins(audit);

    audit.seedEnd = this.seed;

    return {
      numeric,
      categorical,
      audit: this.enableAudit ? audit : undefined
    };
  }

  // -----------------------------
  // NUMERIC BINNING
  // -----------------------------
  buildNumericBins(audit) {
    if (!this.numeric.length) return [];

    return this.numeric.map(attr => {
      // FIX: was `if(!attr || attr.name)` — missing `!` before attr.name
      // Original condition was TRUE for valid attrs (they DO have a name)
      // → every valid attribute was treated as invalid → all returned null
      // → numericBins always [] → service threw "❌ No bins generated"
      if (!attr || !attr.name) {
        this.logger?.error?.({ type: 'INVALID_NUMERIC_ATTRIBUTE' });
        return null;
      }

      const binCount = this.resolveBinCount(attr);
      const bins     = this.generateEqualWidthBins(binCount);

      if (this.enableAudit) {
        audit.numeric.push({
          name:     attr.name,
          binCount,
          strategy: 'equal_width'
        });
      }

      return { name: attr.name, type: 'numeric', bins };
    }).filter(Boolean);
  }

  // -----------------------------
  // CATEGORICAL BINNING
  // -----------------------------
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

      // FIX: skip columns with no distinct values
      // Passing empty bins[] to SegmentModel throws:
      // "❌ {column} requires selected_values"
      // Return null so .filter(Boolean) removes it cleanly.
      if (values.length === 0) return null;


      // STEP 3: limit safely
      const bins = values.slice(0, this.categoricalTopN);

      if (this.enableAudit) {
        audit.categorical.push({
          name:          attrName,
          totalDistinct: values.length,
          returned:      bins.length,
          strategy:      'distinct_values_filtered'
        });
      }

      return { name: attrName, type: 'categorical', bins };
    }).filter(Boolean);
  }

  // -----------------------------
  // BIN COUNT RESOLUTION
  // -----------------------------
  resolveBinCount(attr) {
    const base      = this.numericBins;
    const variation = this.random(2); // 0 or 1
    const count     = Math.min(base + variation, this.maxBins);
    return Math.max(2, count);
  }

  // -----------------------------
  // EQUAL WIDTH BIN GENERATOR
  // Generates bins from 0–100 as normalized percentile ranges.
  // For real column ranges, pass min/max via attr when available.
  // -----------------------------
  generateEqualWidthBins(count) {
    const bins = [];
    const step = 100 / count;

    for (let i = 0; i < count; i++) {
      // FIX: use floor for min and ceil for max — never round both
      // Math.round() caused adjacent bins to share the same edge value
      // e.g. count=3: 0-33, 33-67 → sorted[i].min(33) <= sorted[i-1].max(33) → overlap
      // floor/ceil guarantees min of next bin is always > max of previous bin
      const min = i === 0 ? 0 : Math.floor(i * step) + 1;
      const max = i === count - 1 ? 100 : Math.floor((i + 1) * step);
      bins.push({ min, max });
    }

    return bins;
  }

  // -----------------------------
  // SEEDED RANDOM (LCG)
  // -----------------------------
  random(max) {
    if (this.seed !== null) {
      this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
      return this.seed % max;
    }
    return Math.floor(Math.random() * max);
  }

  // -----------------------------
  // TEST SUPPORT
  // -----------------------------
  resetSeed() {
    // FIX: was this.initialSeed referencing undefined (typo was intialSeed)
    this.seed = this.initialSeed;
  }
}