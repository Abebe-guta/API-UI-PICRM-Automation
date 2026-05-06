// domain/schema/schema.normalizer.js

// -----------------------------
// BLOCKED FIELDS (GLOBAL RULE)=>Sensitive fields that should be excluded from selection
// -----------------------------
const BLOCKED_FIELDS = Object.freeze([
  'account_number',
  'phone_number',
  'tin_number',
  'email',
  'customer_id'
]);

// -----------------------------
// TYPE NORMALIZATION MAP
// -----------------------------
const TYPE_ALIASES = Object.freeze({
  // numeric
  bigint: 'numeric',
  int: 'numeric',
  integer: 'numeric',
  float: 'numeric',
  double: 'numeric',
  decimal: 'numeric',
  number: 'numeric',

  // categorical
  text: 'categorical',
  varchar: 'categorical',
  char: 'categorical',
  string: 'categorical',

  // date
  date: 'date',
  timestamp: 'date',
  datetime: 'date'
});

// -----------------------------
// SUPPORTED TYPES
// -----------------------------
const VALID_TYPES = Object.freeze([
  'numeric',
  'categorical',
  'date'
]);

// -----------------------------
// Normalize single column
// -----------------------------
function normalizeColumn(raw) {
  if (!raw || typeof raw !== 'object') return null;

 //Extract column name with multiple fallbacks
  const rawName  =
    raw.name ||
    raw.column_name ||
    raw.field_name;

    // -----------------------------
  // Validation: Name must be a non-empty string
  // -----------------------------
   const cleanName = rawName ? String(rawName).trim() : ''; 

  if (!cleanName) {
      console.warn('⚠️ Invalid column name:', rawName);
      return null;
  }
   // Even if name is invalid, we still want to check for blocked fields
   const normalizedName = cleanName.toLowerCase();
  if (BLOCKED_FIELDS.includes(normalizedName)) {
         return null;
       }
  

  // -----------------------------
  // TYPE INFERENCE
  // -----------------------------
   // Extract type with multiple fallbacks
    let type =
    raw.type_category ||
    raw.type          ||
    raw.dataType;

  if (type) {
    type = String(type).toLowerCase().trim();
    type = TYPE_ALIASES[type] || type;
  }

  // -----------------------------
  // Type stronger fallback inference from data_type
  // -----------------------------
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
  if (!type) return null;
  if (!VALID_TYPES.includes(type)) return null;

  return Object.freeze({
    name: cleanName,
    type
  });
}

// -----------------------------
// Normalize full schema
// -----------------------------
export function normalizeSchema(columns = []) {
  if (!Array.isArray(columns)) {
    throw new Error('❌ Schema must be an array');
  }

  const normalized = columns
    .map(normalizeColumn)
    .filter(Boolean);

  // -----------------------------
  // Prevents duplicate schema
  // -----------------------------
  const seen = new Set();
  const unique = [];

  for (const col of normalized) {
    if (seen.has(col.name)) continue;
    seen.add(col.name);
    unique.push(col);
  }

  return unique;
}