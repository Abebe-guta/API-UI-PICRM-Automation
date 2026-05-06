import { validateColumnsResponse } from "./contracts/columns.contract";

export class ColumnsAPI {
  constructor(baseAPI) {
    if (!baseAPI) {
      throw new Error('❌ baseAPI is required');
    }

    this.baseAPI = baseAPI;
  }

  // -----------------------------
  // Get all loan tables
  // -----------------------------
  async getLoanDataTables() {
    const response = await this.baseAPI.get(
      '/api/v1/loan-data/tables'
    );

    // add contract later if backend stabilizes
    return response;
  }

  // -----------------------------
  // Get columns by table name
  // -----------------------------
  async getColumns(tableName) {
    if (!tableName) {
      throw new Error('❌ tableName is required');
    }

    const response = await this.baseAPI.get(
      '/api/v1/segments/columns',
      {
        params: {
          table_name: tableName
        }
      }
    );

    // CONTRACT = ONLY VALIDATION + NORMALIZATION
    const normalized = validateColumnsResponse(response);

    return normalized;
  }
}