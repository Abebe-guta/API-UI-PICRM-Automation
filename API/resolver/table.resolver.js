export class TableResolver {
  constructor({ logger = null } = {}) {
    this.logger = logger;
  }

  // -----------------------------
  // SELECT TABLE FROM API RESULT
  // -----------------------------
  selectTable(tables, { seed = null } = {}) {
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('❌ No tables available for selection');
    }

    // -----------------------------
    // normalize input
    // -----------------------------
    const validTables = tables.filter(t => t?.name);

    if (!validTables.length) {
      throw new Error('❌ No valid tables found after filtering');
    }

    // -----------------------------
    // DETERMINISTIC MODE
    // -----------------------------
    if (seed !== null) {
      const index = seed % validTables.length;

      const selected = validTables[index];

      this.logger?.info?.({
        type: 'TABLE_SELECTED_DETERMINISTIC',
        table: selected.name,
        seed
      });

      return selected;
    }

    // -----------------------------
    // RANDOM MODE (EXPLORATION / TEST VARIATION)
    // -----------------------------
    const selected =
      validTables[Math.floor(Math.random() * validTables.length)];

    this.logger?.info?.({
      type: 'TABLE_SELECTED_RANDOM',
      table: selected.name
    });

    return selected;
  }

  // -----------------------------
  // OPTIONAL: FILTER TABLES (future extension)
  // -----------------------------
  filterTables(tables, predicate = () => true) {
    return tables.filter(predicate);
  }
}