// strategies/selection/attribute.selector.js

export class AttributeSelector {
  constructor(
    { numeric = [], categorical = [] },
    {
      mode = 'balanced',
      config = {},
      logger = null
    } = {}
  ) {
    this.numeric = numeric;
    this.categorical = categorical;

    this.mode = mode;
    this.logger = logger;

    this.preferredNumeric = Array.isArray(config.preferredNumeric)
      ? config.preferredNumeric
      : [];

    this.preferredCategorical = Array.isArray(config.preferredCategorical)
      ? config.preferredCategorical
      : [];

    this.logger?.debug?.({
      type: 'ATTRIBUTE_SELECTOR_INIT',
      preferredNumeric: this.preferredNumeric,
      preferredCategorical: this.preferredCategorical
    });
  }

  // =========================================================
  // MAIN ENTRY
  // =========================================================
  select({ numericCount = 1, categoricalCount = 1 } = {}) {
    const audit = {
      selected: [],
      preferredUsed: [],
      fallbackUsed: [],

      // runId is ONLY for log correlation (not selection logic)
      runId:
        (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `run-${Date.now()}`,

      timestamp: new Date().toISOString(),
      mode: this.mode,
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

    return { numeric, categorical, audit };
  }

  // =========================================================
  // NUMERIC
  // =========================================================
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

  // =========================================================
  // CATEGORICAL
  // =========================================================
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

  // =========================================================
  // BALANCED ENGINE
  // =========================================================
  balancedSelect(pool, preferredList, count, type, audit) {
    if (!pool.length) {
      this.logger?.warn?.({
        type: 'EMPTY_POOL',
        fieldType: type,
        runId: audit.runId
      });
      return [];
    }

    // ---------------------------------------------------------
    // Single source of truth for uniqueness (first-write-wins)
    // ---------------------------------------------------------
    //create unique items by name to prevent duplicates across preferred and fallback pools
    const availableMap = new Map();

    for (const item of pool) {
      //store new names
      if (!availableMap.has(item.name)) {
        availableMap.set(item.name, item);
      }
      //log duplicates but don't add them to the map to avoid selection (first-write-wins rule)
      else {
        this.logger?.warn?.({
          type: 'DUPLICATE_NAME',
          name: item.name,
          runId: audit.runId
        });
      }
    }
    //Convert preferredList to Set for efficent lookup

    const preferredSet = new Set(preferredList);
    //Filter valid preferred items actually exist in pool
    const validPreferred = preferredList.filter(name => availableMap.has(name));
    //filter missing preferred items for logging
    const missingPreferred = preferredList.filter(name => !availableMap.has(name));

    if (missingPreferred.length) {
      this.logger?.warn?.({
        type: 'PREFERRED_MISSING',
        fieldType: type,
        missing: missingPreferred,
        runId: audit.runId
      });
    }
    //Convert preferred names → actual objects ('name'->{name:"name", ...data})
    const preferredItems = validPreferred.map(name =>
      availableMap.get(name)
    );

   //fallback pool excludes preferred items to avoid duplicates in selection
    const fallbackItems = Array.from(availableMap.values())
      .filter(item => !preferredSet.has(item.name));
    //This will store final output.
    const result = [];

    // Add preferred items first (randomized)
    result.push(
      ...this.pickRandom(
        preferredItems,
        Math.min(count, preferredItems.length),
        type,
        audit,
        true
      )
    );
    //Calculate remaining slots after preferred selection
    const remaining = count - result.length;

    // Fill remaining slots using fallback items
    if (remaining > 0) {
      result.push(
        ...this.pickRandom(
          fallbackItems,
          remaining,
          type,
          audit,
          false  //ikely means "not preferred"
        )
      );
    }

    return result;
  }

  // =========================================================
  // RANDOM PICK
  // =========================================================
  pickRandom(arr, count, type, audit, isPreferred) {
    if (!arr?.length || count <= 0) return [];

    const safeCount = Math.min(count, arr.length);
    const selected = this.shuffle(arr).slice(0, safeCount);

    for (const item of selected) {
      //Store selection record
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

  // =========================================================
  // Pure Fisher-Yates
  // Stateless and intentionally non-deterministic
  // =========================================================
  shuffle(array) {
    const arr = [...array];
    //Fisher-Yates loop
    for (let i = arr.length - 1; i > 0; i--) {
      //Pick random index (0 to i)
      const j = Math.floor(Math.random() * (i + 1));
      //Swap elements (current element[i] and random element[j])
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
}