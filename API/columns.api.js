export class ColumnsAPI {
  constructor(baseAPI) {
    this.baseAPI = baseAPI;
  }

  // -----------------------------
  // Get all loan tables
  // -----------------------------
  async getLoanDataTables() {
    return await this.baseAPI.get('/api/v1/loan-data/tables');
  }

  // -----------------------------
  // Get columns by table name
  // -----------------------------
  async getColumns(tableName) {
    const response = await this.baseAPI.get(
      '/api/v1/segments/columns',
      {
        params: {
          table_name: tableName
        }
      }
    );

    // Basic validation
    if (!response?.columns) {
      throw new Error(
        `Failed to fetch columns for table: ${tableName}`
      );
    }

    return response.columns;
  }

  // -----------------------------
  // Helper: numeric columns
  // -----------------------------
  getNumeric(columns = []) {
    return columns.filter(c => c.type_category === 'numeric');
  }

  // -----------------------------
  // Helper: categorical columns
  // -----------------------------
  getCategorical(columns = []) {
    return columns.filter(c => c.type_category === 'categorical');
  }

  // -----------------------------
  // Helper: date columns
  // -----------------------------
  getDate(columns = []) {
    return columns.filter(c => c.type_category === 'date');
  }

  // -----------------------------
  // Helper: pick random item
  // -----------------------------
  pickRandom(arr = []) {
    if (!arr.length) {
      throw new Error('Cannot pick random item from empty array');
    }

    return arr[Math.floor(Math.random() * arr.length)];
  }

  // -----------------------------
  // Smart column selection
  // -----------------------------
  pickSmartAttributes(columns = []) {
    if (!columns.length) {
      throw new Error('No columns provided for smart selection');
    }

    const numeric = this.getNumeric(columns);
    const categorical = this.getCategorical(columns);

    if (!numeric.length || !categorical.length) {
      throw new Error('Not enough columns to build segment');
    }

    return {
      numeric: this.pickRandom(numeric),
      categorical: this.pickRandom(categorical)
    };
  }
}