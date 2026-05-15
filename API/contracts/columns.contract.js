// ============================================================
// api/contracts/columns.contract.js
// PURPOSE:
//   Validate raw API columns response shape ONLY.
//
// IMPORTANT:
//   Type normalization is handled centrally by:
//     domain/schema/schema.normalizer.js
//
//   This contract layer should NEVER reject valid aliases.
// ============================================================

import { normalizeSchema } from '../../Domain/schema/schema.normalizer.js';

// ------------------------------------------------------------
// Validate API response structure
// ------------------------------------------------------------
export function validateColumnsResponse(data) {

  // Supports:
  //   { columns: [...] }
  //   { data: [...] }
  //   [...]
  const raw = Array.isArray(data)
    ? data
    : data?.columns ?? data?.data ?? [];

  if (!Array.isArray(raw)) {
    throw new Error('❌ Columns response must be an array');
  }

  if (raw.length === 0) {
    console.warn(
      '⚠️ Columns list is empty — check environment or table name'
    );
  }

  // ----------------------------------------------------------
  // Basic structural validation only
  // ----------------------------------------------------------
  raw.forEach((column, index) => {

    if (!column || typeof column !== 'object') {
      throw new Error(
        `❌ Column at index ${index} is not an object`
      );
    }

    const name =
      column.name ||
      column.column_name ||
      column.field_name;

    if (!name) {
      throw new Error(
        `❌ Column at index ${index} missing name`
      );
    }
  });

  // ----------------------------------------------------------
  // CENTRALIZED NORMALIZATION
  // ----------------------------------------------------------
  const normalized = normalizeSchema(raw);

  if (normalized.length === 0) {
    throw new Error(
      '❌ No usable columns after schema normalization'
    );
  }

  return {
    all: normalized,
    usable: normalized
  };
}