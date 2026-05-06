import {validateCreateSegmentResponse,validateSegmentListResponse} from './contracts/segment.contract.js';
import {validateDistinctValuesResponse} from './contracts/distinctValues.contract.js';
import {validatePreviewResponse} from './contracts/preview.contract.js';

// -----------------------------
// Segment API (CLEAN TRANSPORT LAYER)
// -----------------------------
export class SegmentAPI {
  constructor(baseAPI) {
    if (!baseAPI) {
      throw new Error('❌ baseAPI is required');
    }
    this.baseAPI = baseAPI;
  }

  // -----------------------------
  // Create Segment
  // -----------------------------
  async createSegment(payload) {
    const response = await this.baseAPI.post(
      '/api/v1/segments',
      payload
    );

    // CONTRACT VALIDATION ONLY
    validateCreateSegmentResponse(response);

    return response;
  }

  // -----------------------------
  // Preview Segment
  // -----------------------------
  async previewSegment(payload) {
    const response = await this.baseAPI.post(
      '/api/v1/segments/preview',
      payload
    );

    validatePreviewResponse(response);

    return response;
  }

  // -----------------------------
  // Get Segments
  // -----------------------------
  async getSegments() {
    const response = await this.baseAPI.get(
      '/api/v1/segments'
    );

    validateSegmentListResponse(response);

    return response;
  }

  // -----------------------------
  // Distinct Values
  // -----------------------------
  async getDistinctValues(payload) {
    const response = await this.baseAPI.post(
      '/api/v1/segments/distinct-values',
      payload
    );

    validateDistinctValuesResponse(response);

    return response;
  }

  // -----------------------------
  // Delete Segment
  // -----------------------------
  async deleteSegment(segmentId) {
    if (!segmentId) {
      throw new Error('❌ segmentId is required');
    }

    return this.baseAPI.post(
      `/api/v1/segments/${segmentId}/delete`
    );
  }
}