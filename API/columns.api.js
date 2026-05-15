// api/columns.api.js

import { validateColumnsResponse } from './contracts/columns.contract.js';

export class ColumnsAPI {
  constructor(baseAPI) {
    if (!baseAPI) {
      throw new Error('❌ baseAPI is required');
    }
    this.baseAPI = baseAPI;
  }

  // -----------------------------
  // Get all loan tables
  // Returns: { success, tables: ['loan_table_coop'], message }
  // -----------------------------
  async getLoanDataTables() {
    const response = await this.baseAPI.get('/api/v1/loan-data/tables');
    return response;
  }

  // -----------------------------
  // Get columns by table name
  // Returns: { all: [...], usable: [...] } via contract
  // -----------------------------
  async getColumns(tableName) {
    if (!tableName) throw new Error('❌ tableName is required');

    const response = await this.baseAPI.get(
      '/api/v1/segments/columns',
      { params: { table_name: tableName } }
    );

    return validateColumnsResponse(response);
  }

  // -----------------------------
  // Get distinct values for a categorical column
  // POST /api/v1/segments/distinct-values
  // Returns: { success, values: ['VAL1', 'VAL2', ...], total }
  // Used by segmentBuilder.service to populate distinctValuesMap
  // before BinStrategy runs
  // -----------------------------
  async getDistinctValues({ table_name, column_name, limit = 100, offset = 0 }) {
    if (!table_name)  throw new Error('❌ table_name is required');
    if (!column_name) throw new Error('❌ column_name is required');

    const response = await this.baseAPI.post(
      '/api/v1/segments/distinct-values',
      { table_name, column_name, limit, offset }
    );

    // Response: { success, values: ['BACHELOR_DEGREE', ...], total, message }
    // Extract and clean values — remove nulls, dedupe
    const raw = response?.values ?? [];
    const values = [...new Set(
      raw.filter(v => v !== null && v !== undefined)
    )];

    return { values, total: response?.total ?? values.length };
  }
}