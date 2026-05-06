// api/contracts/columns.contract.js

const ALLOWED_TYPES = ['numeric', 'categorical', 'date'];

function normalizeColumn(raw) {
  const name = raw.name || raw.column_name || raw.field_name;
  const type = raw.type_category || raw.data_type || raw.type;

  if (!name) {
    throw new Error(`Column missing name fields: ${JSON.stringify(raw)}`);
  }
  if (!type) {
    throw new Error(`Column missing type fields: ${JSON.stringify(raw)}`);
  }

  return {
    name,
    type,
    isSupported: ALLOWED_TYPES.includes(type),
    original: raw
  };
}

export function validateColumnsResponse(data) {
  // FIX: API returns { success, columns: [...], message }
  // Contract expected a plain array — extract .columns first
  // Also handles plain array for backwards compatibility
  const raw = Array.isArray(data)
    ? data
    : data?.columns ?? data?.data ?? [];

  if (!Array.isArray(raw)) {
    throw new Error('❌ Columns response must be an array');
  }

  if (raw.length === 0) {
    console.warn('⚠️ Columns list is empty — check environment or table name');
  }

  const seen       = new Set();
  const normalized = [];

  raw.forEach((column, index) => {
    if (!column || typeof column !== 'object') {
      throw new Error(`❌ Column at index ${index} is not an object: ${JSON.stringify(column)}`);
    }

    const norm = normalizeColumn(column);

    if (seen.has(norm.name)) {
      console.warn(`⚠️ Duplicate column name found at index ${index}: ${norm.name}`);
    }
    seen.add(norm.name);

    if (!norm.isSupported) {
      console.warn(`⚠️ Column at index ${index} has unsupported type: ${norm.type}`);
    }

    normalized.push(norm);
  });

  return {
    all:    normalized,
    usable: normalized.filter(c => c.isSupported)
  };
}