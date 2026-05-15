// api/contracts/preview.contract.js

// api/contracts/preview.contract.js
//
// Real backend response shape:
// {
//   success:          true,
//   message:          "Preview complete: 77 rows estimated",
//   estimated_rows:   77,
//   attribute_counts: { education_level: 6, customer_region: 15 },
//   sample_rows:      [{ education_level, customer_region, sum_*, loan_count }],
//   error:            null
// }

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

export function validatePreviewResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('❌ Preview response must be an object');
  }

  // Backend returns estimated_rows (not total_records or data[])
  if (data.estimated_rows !== undefined && !isValidNumber(data.estimated_rows)) {
    throw new Error('❌ estimated_rows must be a number');
  }

  if (data.sample_rows !== undefined && !Array.isArray(data.sample_rows)) {
    throw new Error('❌ sample_rows must be an array');
  }

  // Normalise to a consistent shape our tests can rely on
  // regardless of which backend field name is used
  return {
    // unified field — works whether backend sends estimated_rows or total_records
    total_records: data.estimated_rows ?? data.total_records ?? 0,
    data:          data.sample_rows    ?? data.data          ?? [],
    attribute_counts: data.attribute_counts ?? {},
    message:          data.message         ?? '',
  };
}