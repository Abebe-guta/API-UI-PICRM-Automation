// strategies/selection/metric.selector.js

//These are the only allowed aggregations.
const VALID_AGGREGATIONS = Object.freeze([
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'COUNT'
]);
//These operations only work on numeric columns.
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
      seed = null,
      logger = null,
      config = {}
    } = {}
  ) {
    //Store columns
    this.columns = columns;

    //Seed setup (Enables deterministic metric selection)
    this.seed = seed;
    this.initialSeed = seed;

    //Logger
    this.logger = logger;

    // CONFIG (extendable)
    this.numericAggs = config.numericAggs || ['SUM', 'AVG', 'MIN', 'MAX'];
    this.categoricalAggs = config.categoricalAggs || ['COUNT'];
    this.allowedMetrics = config.allowedMetrics || null;   // array of allowed column names (optional)
  }

  // -----------------------------
  // MAIN ENTRY
  // -----------------------------
  select(metricsCount = 1) {
    //Seed snapshot (Tracks randomness state.)
    const seedStart = this.seed;

    //Create audit object
    const audit = {
      runId: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

      timestamp: Date.now(),
      seedStart,
      seedEnd: null,

      totalColumns: this.columns.length,
      selected: []
    };
     //Validate input
    if (!this.columns.length) {
      throw new Error('❌ No columns available for metrics');
    }
      //Split columns by type
    const numericColumns = this.columns.filter(c => c.type === 'numeric');
    const categoricalColumns = this.columns.filter(c => c.type === 'categorical');

    if (!numericColumns.length && !categoricalColumns.length) {
      throw new Error('❌ No valid columns for metrics');
    }

    // build candidate pool instead of pushing all
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
      if (candidates.length === 0) {
        this.logger?.warn?.({
          type: 'NO_METRIC_CANDIDATES_AFTER_WHITELIST',
          allowedMetrics: this.allowedMetrics,
          originalCount: before
        });
        audit.seedEnd = this.seed;
        return { metrics: [], audit };
      }
    }

    //Handle Empty candidates
       if (!candidates.length) {
      this.logger?.warn?.({ type: 'NO_METRIC_CANDIDATES' });
      audit.seedEnd = this.seed;
      return { metrics: [], audit };
    }

    // shuffle first (removes ordering bias)
    const shuffled = this.shuffle(candidates);

    // avoid duplicate column selection
    const seenColumns = new Set();
    const result = [];
       //Loop through shuffled candidates
    for (const metric of shuffled) {
         //Stop when enough metrics
      if (result.length >= metricsCount) break;
        //Avoid duplicate columns
      if (seenColumns.has(metric.column_name)) continue;

      this.validate(metric);

      result.push({
        column_name: metric.column_name,
        aggregation: metric.aggregation
      });
        //Track used column
      seenColumns.add(metric.column_name);

      // audit tracking
      audit.selected.push({
        column: metric.column_name,
        aggregation: metric.aggregation
      });
    }

    // fallback if not enough unique columns
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

    audit.seedEnd = this.seed;

    return {
      metrics: result,
      audit
    };
  }

  // -----------------------------
  // SHUFFLE (SEEDED)
  // -----------------------------
  shuffle(array) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.random(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  // -----------------------------
  // SEEDED RANDOM
  // -----------------------------
  random(max) {
    if (this.seed !== null) {
      this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
      return this.seed % max;
    }

    return Math.floor(Math.random() * max);
  }

  // -----------------------------
  // VALIDATION
  // -----------------------------
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

  // -----------------------------
  // TEST SUPPORT
  // -----------------------------
  resetSeed() {
    this.seed = this.initialSeed;
  }
}