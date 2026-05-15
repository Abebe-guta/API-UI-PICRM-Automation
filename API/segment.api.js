import {
  validateCreateSegmentResponse,
  validateSegmentListResponse
} from './contracts/segment.contract.js';

import { validateDistinctValuesResponse } from './contracts/distinctValues.contract.js';
import { validatePreviewResponse } from './contracts/preview.contract.js';

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
  // PAYLOAD NORMALIZER
  // -----------------------------
  _normalizeConfig(payload) {
    const { name, description, ...configFields } = payload;

    const attributes = (configFields.attributes ?? []).map(attr => {

      console.log('🧪 Selected Attribute:', {
        column_name: attr.column_name,
        mode: attr.mode,
        selected_values: attr.selected_values,
        numeric_bins: attr.numeric_bins
      });

      return {
        column_name: attr.column_name,
        mode: attr.mode,

        selected_values: attr.selected_values?.length
          ? attr.selected_values
          : null,

        numeric_bins: attr.numeric_bins?.length
          ? attr.numeric_bins.map((b, i, arr) => ({
              label: b.label ?? `${b.min}-${b.max}`,
              min_value: i === 0 ? null : (b.min ?? null),
              max_value: i === arr.length - 1 ? null : (b.max ?? null),
              include_min: true,
              include_max: false,
            }))
          : null,

        date_bins: null,
        categorical_mappings: null,
        include_other: true,
      };
    });

    const target_metrics = (configFields.target_metrics ?? []).map(m =>
      typeof m === 'string' ? m : m.column_name
    );

    return {
      name,
      description,
      config: {
        table_name: configFields.table_name,
        attributes,
        target_metrics,
        derived_columns: configFields.derived_columns ?? null,
      }
    };
  }

  // -----------------------------
  // CREATE SEGMENT
  // -----------------------------
  async createSegment(payload) {
    const { name, description, config } = this._normalizeConfig(payload);

    const body = {
      name: name ?? 'AutoSegment',
      description: description ?? '',
      config,
    };

    const response = await this.baseAPI.post('/api/v1/segments', body);

    // =========================================================
    // normalize response BEFORE returning
    // BEFORE: returned raw response → res.id was undefined
    // AFTER: return extracted segment
    // =========================================================
    const segment = validateCreateSegmentResponse(response);
    return segment;
  }

  // -----------------------------
  // PREVIEW SEGMENT
  // -----------------------------
  async previewSegment(payload) {
    const { config } = this._normalizeConfig(payload);

    const body = { config };

    const response = await this.baseAPI.post(
      '/api/v1/segments/preview',
      body
    );

    return validatePreviewResponse(response);
  }

  // -----------------------------
  // GET SEGMENTS
  // -----------------------------
  async getSegments() {
    const response = await this.baseAPI.get('/api/v1/segments');

    // =========================================================
    // 🔧 FIX #2: normalize list response safely
    // BEFORE: assumed raw array → failed when API wrapped response
    // =========================================================
    const list = Array.isArray(response)
      ? response
      : response?.data ?? response?.segments ?? [];

    validateSegmentListResponse(list);
    return list;
  }

  // -----------------------------
  // DISTINCT VALUES
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
  // DELETE SEGMENT
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