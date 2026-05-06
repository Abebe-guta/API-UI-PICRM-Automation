// strategies/selection/attribute.selector.js

export class AttributeSelector {
  constructor({ numeric = [], categorical = [] },
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
    this.initialSeed = seed; // For potential reset
    this.mode = mode;
    this.logger = logger;
    this.preferredNumeric = config.preferredNumeric || [];
    this.preferredCategorical = config.preferredCategorical || [];
  }

  // -----------------------------
  // MAIN ENTRY
  // -----------------------------
  select({ numericCount = 1, categoricalCount = 1 } = {}) {
     //runtime seed snapshot (not initialSeed)
     const seedStart = this.seed;
     //Build audit object
/*Metadata
timestamp
mode
seedStart
seedEnd
numericPoolSize
categoricalPoolSize
*/
     const audit = {
      selected: [],
      preferredUsed: [],
      fallbackUsed: [],
      //Unique run ID
      runId:(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      mode: this.mode,
      seedStart,
      seedEnd: null,
      numericPoolSize: this.numeric.length,
      categoricalPoolSize: this.categorical.length
    };
    // -----------------------------
    // EMPTY SCHEMA SAFETY
    // -----------------------------
    if (!this.numeric.length && !this.categorical.length) {
      this.logger?.warn?.({
        type:'EMPTY_SCHEMA',
        runId: audit.runId
      });
      return { numeric: [], categorical: [], audit };
  }
    const numeric = this.selectNumeric(numericCount, audit);
    const categorical = this.selectCategorical(categoricalCount, audit);


// -----------------------------
// FINAL SEED SNAPSHOT
// -----------------------------
 audit.seedEnd=this.seed;

//detect unexpected seed drift [If seed changed unexpectedly → randomness may be corrupted]
if (seedStart !== audit.seedEnd) {
  this.logger?.warn?.({
    type:'SEED_DRIFT',
    seedStart:audit.seedStart,
    seedEnd: audit.seedEnd,
    runId: audit.runId
  });
}
return { numeric, categorical, audit };
}

// -----------------------------
// NUMERIC
// -----------------------------
selectNumeric(count,audit) {
  if (!this.numeric.length) {
    this.logger?.warn?.({
      type:'EMPTY_NUMERIC_COLUMNS',
      runId: audit.runId
    });
    return [];
  }
  if(this.mode === 'pure') {
    return this.pickRandom(this.numeric, count,'numeric',audit,false);
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
      this.logger?.warn?.({ type: 'EMPTY_CATEGORICAL_COLUMNS', runId: audit.runId });
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
  // BALANCED ENGINE [This is the heart of the system.]
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
     //Build lookup structures for efficient access
    const availableMap = new Map(pool.map(c => [c.name, c]));
    const preferredSet = new Set(preferredList);

    //Validate preferred list against available pool
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
   //Build preferred items list while preserving order from preferredList
    const preferredItems = validPreferred.map(name => availableMap.get(name));

    // safer fallback (reduce ordering bias)
    const fallbackItems = this.shuffle(
      pool.filter(item => !preferredSet.has(item.name))
    );

    const result = [];

   //pick from preferred
    result.push(
      ...this.pickRandom(
        preferredItems,
        Math.min(count, preferredItems.length),
        type,
        audit,
        true
      )
    );
     //fill remaining from fallback
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
// -----------------------------
    // FINAL DEDUP (cross-pool safety)
    // -----------------------------
    const seen = new Set();
    return result.filter(item => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  }

   // -----------------------------
  // RANDOM PICK
  // -----------------------------
  pickRandom(arr, count, type, audit, isPreferred) {
    //Safety
    if (!arr.length || count <= 0) return [];
 
    //Limit count
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

    return selected;
  }

  // -----------------------------
  // DETERMINISTIC SHUFFLE
  // -----------------------------
  shuffle(array) {
    const arr = [...array];
     
    //Fisher-Yates Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.random(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
  // -----------------------------
  // SEEDED RANDOM (OPTIONAL STABLE TESTING)
  // -----------------------------
    random(max) {
    if (this.seed !== null) {
      //Linear Congruential Generator (LCG) for deterministic randomness
      this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
      return this.seed % max;
    }

    return Math.floor(Math.random() * max);
  }

  // -----------------------------
  // TEST SUPPORT
  // -----------------------------
  resetSeed() {
    this.seed = this.initialSeed;
  }
}