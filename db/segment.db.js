// =============================================================
// db/segment.db.js
// LAYER  : DB — raw query helpers for segment_definitions table
// RULE   : No business logic. Pure SQL wrappers only.
// USED BY: tests/DB/segment.db.spec.js
// =============================================================

import { rows } from '../utils/db.client.js';

// ============================
// SEGMENT EXISTENCE
// ============================

export async function getSegmentById(id) {
  const res = await rows(
    `SELECT
       id,
       name,
       description,
       status,
       created_at
     FROM segment_definitions
     WHERE id = $1`,
    [id]
  );
  return res[0] ?? null;
}

export async function segmentExists(id) {
  const res = await rows(
    `SELECT 1
     FROM segment_definitions
     WHERE id = $1`,
    [id]
  );
  return res.length > 0;
}

// =============================================================
// ATTRIBUTES
// Attributes are stored in config->'attributes' as a jsonb array
// of objects: { column_name, mode, ... }
// =============================================================

export async function getSegmentAttributes(id) {
  return rows(
    `SELECT attr->>'column_name' AS column_name 
     FROM segment_definitions,
          jsonb_array_elements(config->'attributes') AS attr
     WHERE id = $1
     ORDER BY attr->>'column_name'`,
    [id]
  );
}

export async function getSegmentAttributeNames(id) {
  const attrs = await getSegmentAttributes(id);
  return attrs.map(a => a.column_name);
}

// =============================================================
// METRICS
// config->'target_metrics' is stored as ["col1", "col2"], so we extract column names directly
// =============================================================

export async function getSegmentMetrics(id) {
  return rows(
    `SELECT metric AS column_name
     FROM segment_definitions,
          jsonb_array_elements_text(config->'target_metrics') AS metric
     WHERE id = $1
     ORDER BY metric`,
    [id]
  );
}

// =============================================================
// FULL CONFIG
// =============================================================

export async function getSegmentConfig(id) {
  const res = await rows(
    `SELECT config
     FROM segment_definitions
     WHERE id = $1`,
    [id]
  );
  return res[0]?.config ?? null;
}