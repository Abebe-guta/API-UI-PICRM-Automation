function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidId(value) {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && !isNaN(value))
  );
}

function isValidDate(value) {
  return !isNaN(new Date(value).getTime());
}

// -----------------------------
// Validate Segment List (GET /segments)
// -----------------------------
export function validateSegmentListResponse(data) {

  if (!Array.isArray(data)) {
    throw new Error('segments response must be an array');
  }

  if (data.length === 0) {
    console.warn('⚠️ Segments list is empty');
  }

  const ids = new Set();

  data.forEach((segment, index) => {
    if (!segment || typeof segment !== 'object') {
      throw new Error(`❌ Segment at index ${index} is not an object`);
    }

    if (!isValidId(segment.id)) {
      throw new Error(`❌ Invalid segment id at index ${index}`);
    }

    if (ids.has(segment.id)) {
      console.warn(`⚠️ Duplicate segment ID: ${segment.id}`);
    }
    ids.add(segment.id);

    if (!isValidString(segment.name)) {
      throw new Error(`❌ Segment at index ${index} missing valid name`);
    }

    if (segment.created_at && !isValidDate(segment.created_at)) {
      throw new Error(`❌ Segment at index ${index} has invalid created_at`);
    }
  });

  // =========================================================
  // 🔧 FIX: return data (NOT true)
  // This ensures getSegments() downstream logic works
  // =========================================================
  return data;
}

// -----------------------------
// Validate Create Segment Response
// -----------------------------
export function validateCreateSegmentResponse(data) {

  if (!data || typeof data !== 'object') {
    throw new Error('❌ Create Segment response must be an object');
  }

  // backend may return:
  // { segment: {...} } OR { id, name }
  const record = data.segment ?? data;

  if (!isValidId(record.id)) {
    throw new Error(
      `❌ Create segment response missing valid id: ${JSON.stringify(data)}`
    );
  }

  if (record.name && !isValidString(record.name)) {
    throw new Error(`❌ Segment name must be a valid string`);
  }

  if (record.created_at && !isValidDate(record.created_at)) {
    throw new Error(`❌ Invalid created_at in create response`);
  }

  // return normalized object so tests can use .id directly
  return record;
}