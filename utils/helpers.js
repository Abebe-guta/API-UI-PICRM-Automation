// =============================================================
// utils/helpers.js
// LAYER  : Utils — generic reusable tools
// RULE   : NO business logic, NO domain imports
// USED BY: strategies/, services/, fixtures/, tests/
// =============================================================


// -------------------------------------------------------------
// RANDOM UTILITIES (DETERMINISTIC READY)
// -------------------------------------------------------------

export function pickRandom(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomN(arr, n) {
  if (!arr || arr.length === 0) return [];

  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(n, arr.length));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

export function shuffle(arr) {
  const result = [...arr];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}


// -------------------------------------------------------------
// WAIT / RETRY UTILITIES
// -------------------------------------------------------------

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delayMs = 500, factor = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts) {
        const wait = delayMs * Math.pow(factor, attempt - 1);
        await sleep(wait);
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message}`);
}


// -------------------------------------------------------------
// ID / LABEL FORMATTERS (SEED-SAFE)
// -------------------------------------------------------------

export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

export function truncate(str, maxLen = 50) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (err) {
    throw new Error(`deepClone failed: ${err.message}`);
  }
}


// -------------------------------------------------------------
// OBJECT TRANSFORMERS
// -------------------------------------------------------------

export function flattenObject(obj, prefix = '', depth = 0) {
  if (depth > 10) return {};

  return Object.keys(obj || {}).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      Object.assign(acc, flattenObject(obj[key], fullKey, depth + 1));
    } else {
      acc[fullKey] = obj[key];
    }

    return acc;
  }, {});
}

export function groupBy(arr = [], key) {
  if (!Array.isArray(arr)) return {};

  return arr.reduce((acc, item) => {
    const group = item?.[key] ?? 'unknown';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k];
    return acc;
  }, {});
}

export function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  );
}


// -------------------------------------------------------------
// SCHEMA FINGERPRINTING (DEEP DETERMINISTIC HASH)
// -------------------------------------------------------------

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeysDeep(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function hashObject(value) {
  const sorted = sortKeysDeep(value);
  const str = JSON.stringify(sorted);

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return Math.abs(hash).toString(16).padStart(8, '0');
}