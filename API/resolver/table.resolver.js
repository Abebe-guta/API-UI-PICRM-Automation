// api/resolver/table.resolver.js

export class TableResolver {
  constructor({ logger = null } = {}) {
    this.logger = logger;
  }

  // =========================================================
  // SELECT TABLE FROM API RESULT
  // =========================================================
  
  selectTable(tables) {
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('❌ No tables available for selection');
    }

    // normalize input — filter out anything without a name
    const validTables = tables.filter(t => t?.name);

    if (!validTables.length) {
      throw new Error('❌ No valid tables found after filtering');
    }

   
    const selected =
      validTables[Math.floor(Math.random() * validTables.length)];

  
    this.logger?.info?.({
      type:  'TABLE_SELECTED',
      table: selected.name
    });

    return selected;
  }

  // =========================================================
  // OPTIONAL: FILTER TABLES (future extension)
  // =========================================================
  filterTables(tables, predicate = () => true) {
    return tables.filter(predicate);
  }
}