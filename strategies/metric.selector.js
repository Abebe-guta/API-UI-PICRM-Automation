// strategies/metric.selector.js

// These are the only allowed aggregations.
const VALID_AGGREGATIONS = Object.freeze([
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'COUNT'
]);

// These operations only work on numeric columns. set is for fast lookuup during validation
const NUMERIC_ONLY = new Set([
  'SUM',
  'AVG',
  'MIN',
  'MAX'
]);

export class MetricSelector {
  constructor(
    columns = [],
    {
    
      logger = null,
      config = {}
    } = {}
  ) {
    // Store columns
    this.columns = columns;

    // Logger
    this.logger = logger;

    // CONFIG (extendable)
    this.numericAggs = config.numericAggs || ['SUM', 'AVG', 'MIN', 'MAX'];
    this.categoricalAggs = config.categoricalAggs || ['COUNT'];
    this.allowedMetrics = config.allowedMetrics || null; // optional column name whitelist
  }

  // =========================================================
  // MAIN ENTRY
  // =========================================================
  select(metricsCount = 1) {
    const audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `run-${Date.now()}`,

      timestamp: Date.now(),

      totalColumns: this.columns.length,
      selected: []
    };

    // Validate input
    if (!this.columns.length) {
      throw new Error('❌ No columns available for metrics');
    }

    // Split columns by type
    const numericColumns = this.columns.filter(c => c.type === 'numeric');
    const categoricalColumns = this.columns.filter(c => c.type === 'categorical');
    //Ensure Valid Columns Exist
    if (!numericColumns.length && !categoricalColumns.length) {
      throw new Error('❌ No valid columns for metrics');
    }

    // Build candidate pool
    let candidates = [];

    // numeric candidates
    numericColumns.forEach(col => {
      this.numericAggs.forEach(agg => {
        candidates.push({
          column_name: col.name,
          aggregation: agg,
          type: 'numeric'
        });
      });
    });

    // categorical candidates
    categoricalColumns.forEach(col => {
      this.categoricalAggs.forEach(agg => {
        candidates.push({
          column_name: col.name,
          aggregation: agg,
          type: 'categorical'
        });
      });
    });

    // Apply allowed metrics whitelist if provided
    if (this.allowedMetrics && this.allowedMetrics.length) {
      const allowedSet = new Set(this.allowedMetrics);
      const before = candidates.length;
      candidates = candidates.filter(c => allowedSet.has(c.column_name));
      //Handle No Remaining Candidates
      if (candidates.length === 0) {
        this.logger?.warn?.({
          type: 'NO_METRIC_CANDIDATES_AFTER_WHITELIST',
          allowedMetrics: this.allowedMetrics,
          originalCount: before
        });
        return { metrics: [], audit };
      }
    }

    // Handle empty candidates
    if (!candidates.length) {
      this.logger?.warn?.({ type: 'NO_METRIC_CANDIDATES' });
      return { metrics: [], audit };
    }

    // Shuffle first (removes ordering bias)
    const shuffled = this.shuffle(candidates);

    // Avoid duplicate column selection
    const seenColumns = new Set();
    const result = [];

    for (const metric of shuffled) {
      if (result.length >= metricsCount) break;
      if (seenColumns.has(metric.column_name)) continue;

      this.validate(metric);
     //add selected metric
      result.push({
        column_name: metric.column_name,
        aggregation: metric.aggregation
      });
      //mark column as used (future metrics from same column are skipped)
      seenColumns.add(metric.column_name);

      audit.selected.push({
        column: metric.column_name,
        aggregation: metric.aggregation
      });
    }

    // Fallback: allow duplicate columns if not enough unique ones
    if (result.length < metricsCount) {
      for (const metric of shuffled) {
        if (result.length >= metricsCount) break;

        this.validate(metric);

        result.push({
          column_name: metric.column_name,
          aggregation: metric.aggregation
        });

        audit.selected.push({
          column: metric.column_name,
          aggregation: metric.aggregation,
          duplicateAllowed: true
        });
      }
    }

    return { metrics: result, audit };
  }

  // =========================================================
  // SHUFFLE
  // =========================================================
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // =========================================================
  // VALIDATION
  // =========================================================
  validate(metric) {
    if (!VALID_AGGREGATIONS.includes(metric.aggregation)) {
      throw new Error(`❌ Invalid aggregation: ${metric.aggregation}`);
    }

    if (
      NUMERIC_ONLY.has(metric.aggregation) &&
      !this.isNumeric(metric.column_name)
    ) {
      throw new Error(`❌ ${metric.aggregation} requires numeric column`);
    }
  }

  isNumeric(columnName) {
    const col = this.columns.find(c => c.name === columnName);
    return col?.type === 'numeric';
  }
}