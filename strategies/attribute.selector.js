// strategies/selection/attribute.selector.js

export class AttributeSelector {
  constructor(
    { numeric = [], categorical = [] },
    {
      seed = null,
      mode = 'balanced',
      config = {},
      logger = null
    } = {}
  ) {
    this.numeric = numeric;
    this.categorical = categorical;

    this.seed = seed;
    this.initialSeed = seed;

    this.mode = mode;
    this.logger = logger;

    // =========================================================
    // FIX #1: prevent undefined or injected default bias
    // BEFORE: could be string or undefined → caused hidden bias
    // =========================================================
    this.preferredNumeric = Array.isArray(config.preferredNumeric)
      ? config.preferredNumeric
      : [];

    this.preferredCategorical = Array.isArray(config.preferredCategorical)
      ? config.preferredCategorical
      : [];

    // DEBUG (optional - remove in prod)
    this.logger?.debug?.({
      type: 'ATTRIBUTE_SELECTOR_INIT',
      preferredNumeric: this.preferredNumeric,
      preferredCategorical: this.preferredCategorical
    });
  }

  // -----------------------------
  // MAIN ENTRY
  // -----------------------------
  select({ numericCount = 1, categoricalCount = 1 } = {}) {
    const seedStart = this.seed;

    const audit = {
      selected: [],
      preferredUsed: [],
      fallbackUsed: [],
      runId:
        (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      mode: this.mode,
      seedStart,
      seedEnd: seedStart,
      numericPoolSize: this.numeric.length,
      categoricalPoolSize: this.categorical.length
    };

    // EMPTY SAFETY
    if (!this.numeric.length && !this.categorical.length) {
      this.logger?.warn?.({
        type: 'EMPTY_SCHEMA',
        runId: audit.runId
      });

      return { numeric: [], categorical: [], audit };
    }

    const numeric = this.selectNumeric(numericCount, audit);
    const categorical = this.selectCategorical(categoricalCount, audit);

    audit.seedEnd = this.seed;

    // =========================================================
    // FIX #2: proper logging only when real drift happens
    // =========================================================
    if (seedStart !== audit.seedEnd) {
      this.logger?.warn?.({
        type: 'SEED_DRIFT_DETECTED',
        note: 'Seed should not mutate in deterministic mode',
        seedStart,
        seedEnd: audit.seedEnd,
        runId: audit.runId
      });
    }

    return { numeric, categorical, audit };
  }

  // -----------------------------
  // NUMERIC
  // -----------------------------
  selectNumeric(count, audit) {
    if (!this.numeric.length) {
      this.logger?.warn?.({
        type: 'EMPTY_NUMERIC_COLUMNS',
        runId: audit.runId
      });
      return [];
    }

    if (this.mode === 'pure') {
      return this.pickRandom(this.numeric, count, 'numeric', audit, false);
    }

    return this.balancedSelect(
      this.numeric,
      this.preferredNumeric,
      count,
      'numeric',
      audit
    );
  }

  // -----------------------------
  // CATEGORICAL
  // -----------------------------
  selectCategorical(count, audit) {
    if (!this.categorical.length) {
      this.logger?.warn?.({
        type: 'EMPTY_CATEGORICAL_COLUMNS',
        runId: audit.runId
      });
      return [];
    }

    if (this.mode === 'pure') {
      return this.pickRandom(this.categorical, count, 'categorical', audit, false);
    }

    return this.balancedSelect(
      this.categorical,
      this.preferredCategorical,
      count,
      'categorical',
      audit
    );
  }

  // -----------------------------
  // BALANCED ENGINE
  // -----------------------------
  balancedSelect(pool, preferredList, count, type, audit) {
    if (!pool.length) {
      this.logger?.warn?.({
        type: 'EMPTY_POOL',
        fieldType: type,
        runId: audit.runId
      });
      return [];
    }

    const availableMap = new Map(pool.map(c => [c.name, c]));
    const preferredSet = new Set(preferredList);

    const validPreferred = preferredList.filter(name =>
      availableMap.has(name)
    );

    const missingPreferred = preferredList.filter(
      name => !availableMap.has(name)
    );

    if (missingPreferred.length) {
      this.logger?.warn?.({
        type: 'PREFERRED_MISSING',
        fieldType: type,
        missing: missingPreferred,
        runId: audit.runId
      });
    }

    const preferredItems = validPreferred.map(name => availableMap.get(name));

const filtered = pool.filter(item => !preferredSet.has(item.name));
const fallbackItems = this.shuffle(this.shuffle(filtered));

    const result = [];

    result.push(
      ...this.pickRandom(
        preferredItems,
        Math.min(count, preferredItems.length),
        type,
        audit,
        true
      )
    );

    const remaining = count - result.length;

    if (remaining > 0) {
      result.push(
        ...this.pickRandom(
          fallbackItems,
          remaining,
          type,
          audit,
          false
        )
      );
    }

    // FINAL DEDUP
    const seen = new Set();
    return result.filter(item => {
      if (!item?.name) return false;
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  }

  // -----------------------------
  // RANDOM PICK
  // -----------------------------
  pickRandom(arr, count, type, audit, isPreferred) {
    if (!arr?.length || count <= 0) return [];

    const safeCount = Math.min(count, arr.length);
    const selected = this.shuffle(arr).slice(0, safeCount);

    for (const item of selected) {
      audit.selected.push({
        name: item.name,
        type,
        preferred: isPreferred
      });

      if (isPreferred) {
        audit.preferredUsed.push(item.name);
      } else {
        audit.fallbackUsed.push(item.name);
      }
    }
     this.logger?.debug?.({
  type: 'ATTRIBUTE_SELECTED',
  selected: selected.map(s => s.name),
  poolType: type
});

    return selected;
  }

  // -----------------------------
  // SAFE DETERMINISTIC SHUFFLE
  // -----------------------------
  shuffle(array) {
    const arr = [...array];

    let state = this.seed ?? 123456789;

    const random = (max) => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state % max;
    };

    for (let i = arr.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  resetSeed() {
    this.seed = this.initialSeed;
  }
}