// -----------------------------
//HELPER
//-----------------------------
function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function isValidId(value) {
  return(
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
    throw new Error(' segments response must be an array');
  }
  if (data.length === 0) {
    console.warn('⚠️ Segments list is empty — check environment or filters');
  }
  const ids= new Set();
  data.forEach((segment, index) => {
    // -----------------------------
    // Basic structure validation
    // -----------------------------
    if (!segment || typeof segment!== 'object') {
      throw new Error(`❌ Segment at index ${index} is not an object`);
    }
    // -----------------------------
    // ID validation
    // -----------------------------
    if (!isValidId(segment.id)) {
      throw new Error(`❌ Invalid segment id at index ${index}: ${JSON.stringify(segment)}`);
    }
    // -----------------------------
    // Duplicate detection
    // -----------------------------
    if (ids.has(segment.id)) {
      console.warn(`⚠️ Duplicate segment ID found at index ${segment.id}`);
    }
    ids.add(segment.id);
// -----------------------------
// Name validation
// -----------------------------
    if (!isValidString(segment.name)) {
      throw new Error(`❌ Segment at index ${index} missing valid name: ${JSON.stringify(segment)}`);
    }
        // -----------------------------
    // Optional fields validation
    // -----------------------------
    if (segment.created_at && !isValidDate(segment.created_at)) {
      throw new Error(`❌ Segment at index ${index} has invalid created_at: ${segment.created_at}`);
    }
  });
  return true;
}
// -----------------------------
// Validate Create Segment Response
// -----------------------------
export function validateCreateSegmentResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('❌ Create Segment response must be an object');
  }
  if (!isValidId(data.id)) {
    throw new Error(`❌ Create segment response missing valid id: ${JSON.stringify(data)}`);
  }
  if (data.name && !isValidString(data.name)) {
    throw new Error(`❌Segment name must be a valid string : ${JSON.stringify(data)}`);
  }
  if (data.created_at && !isValidDate(data.created_at)) {
    throw new Error(`❌ Invalid created_at date in create response : ${data.created_at}`);
  }
  return true;
}