// api/contracts/preview.contract.js

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// -----------------------------
// Validate Preview Response
// -----------------------------
export function validatePreviewResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('❌ Preview response must be an object');
  }

  if (!Array.isArray(data.data)) {
    throw new Error('❌ Preview data must be an array');
  }

  if (data.data.length === 0) {
    console.warn('⚠️ Preview returned empty dataset');
  }

  // Validate each row
  data.data.forEach((row, rowIndex) => {
    if (!row || typeof row !== 'object') {
      throw new Error(`❌ Row ${rowIndex} is invalid`);
    }

    Object.entries(row).forEach(([key, value]) => {
      // allow primitives only
      const valid =
        isValidString(value) ||
        isValidNumber(value) ||
        value === null;

      if (!valid) {
        throw new Error(
          `❌ Invalid value in row ${rowIndex}, column ${key}`
        );
      }
    });
  });

  // Validate metadata
  if (
    data.total_records !== undefined &&
    !isValidNumber(data.total_records)
  ) {
    throw new Error('❌ total_records must be a number');
  }

  return {
    data: data.data,
    total_records: data.total_records || data.data.length
  };
}