// domain/schema/schema.normalizer.js

// -----------------------------
// BLOCKED FIELDS (GLOBAL RULE)
// Sensitive fields excluded from selection
// -----------------------------
const BLOCKED_FIELDS = Object.freeze([
  'account_number',
  'phone_number',
  'tin_number',
  'email',
  'customer_id',
  'loan_id',        // UUID column — too high cardinality, not useful for segmentation
]);

// -----------------------------
// TYPE NORMALIZATION MAP
// -----------------------------
const TYPE_ALIASES = Object.freeze({
  // numeric
  bigint:  'numeric',
  int:     'numeric',
  integer: 'numeric',
  float:   'numeric',
  double:  'numeric',
  decimal: 'numeric',
  number:  'numeric',

  // categorical
  text:    'categorical',
  varchar: 'categorical',
  char:    'categorical',
  string:  'categorical',

  // date
  date:      'date',
  timestamp: 'date',
  datetime:  'date'
});

// -----------------------------
// SUPPORTED TYPES
// -----------------------------
const VALID_TYPES = Object.freeze(['numeric', 'categorical', 'date']);

// -----------------------------
// Normalize single column
// -----------------------------
function normalizeColumn(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // Extract column name with multiple fallbacks
  const rawName =
    raw.name        ||
    raw.column_name ||
    raw.field_name;

  const cleanName = rawName ? String(rawName).trim() : '';

  // Validation: name must be a non-empty string
  if (!cleanName) {
    console.warn('⚠️ Invalid column name:', rawName);
    return null;
  }

  //blocked fields check moved here — after name is confirmed valid
  if (BLOCKED_FIELDS.includes(cleanName)) {
    return null;
  }

  // Extract type with multiple fallbacks
  let type =
    raw.type_category ||
    raw.type          ||
    raw.dataType;

  // -----------------------------
  // TYPE INFERENCE
  // -----------------------------
  if (type) {
    type = String(type).toLowerCase().trim();
    type = TYPE_ALIASES[type] || type;
  }

  // Stronger fallback inference from data_type field
  if (!type && raw.data_type) {
    const dt = String(raw.data_type).toLowerCase();

    if (['bigint', 'numeric', 'int', 'float', 'double', 'decimal'].includes(dt)) {
      type = 'numeric';
    } else if (['text', 'varchar', 'string', 'char'].includes(dt)) {
      type = 'categorical';
    } else if (['date', 'timestamp', 'datetime'].includes(dt)) {
      type = 'date';
    }
  }

  // -----------------------------
  // VALIDATION GUARD
  // -----------------------------
  if (!type)                    
    return null;
  if (!VALID_TYPES.includes(type)) 
    return null;
  return Object.freeze({ name: cleanName, type });
}

// -----------------------------
// Normalize full schema
// -----------------------------
//cleans and validates the ENTIRE schema array.
export function normalizeSchema(columns = []) {
  if (!Array.isArray(columns)) {
    throw new Error('❌ Schema must be an array');
  }

  const normalized = columns
    .map(normalizeColumn)
    .filter(Boolean);

  // Deduplication — last-write-wins is intentional (stable sort order)
  const seen   = new Set();
  const unique = [];

  for (const col of normalized) {
    if (seen.has(col.name)) continue;
    seen.add(col.name);
    unique.push(col);
  }

  return unique;
}