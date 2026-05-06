// api/contracts/distinctValues.contract.js

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// -----------------------------
// Validate Distinct Values response
// -----------------------------
export function validateDistinctValuesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('❌ DistinctValues response must be an object');
  }

  // CASE 1: Categorical values
  if (Array.isArray(data.values)) {
    if (data.values.length === 0) {
      console.warn('⚠️ Distinct values array is empty');
    }

    data.values.forEach((val, index) => {
      if (
        !isValidString(val) &&
        typeof val !== 'number'
      ) {
        throw new Error(
          `❌ Invalid value at index ${index} in values array`
        );
      }
    });

    return {
      type: 'categorical',
      values: data.values
    };
  }

  // CASE 2: Numeric range
  if (
    isValidNumber(data.min) &&
    isValidNumber(data.max)
  ) {
    if (data.min > data.max) {
      throw new Error('❌ min cannot be greater than max');
    }

    return {
      type: 'numeric',
      min: data.min,
      max: data.max
    };
  }

  throw new Error('❌ Invalid DistinctValues response structure');
}