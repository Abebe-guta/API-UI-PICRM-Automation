// =============================================================
// tests/api/segment.api.spec.js
// =============================================================

import { test, expect }          from '../../fixtures/base.fixture.js';
import { SegmentBuilderService } from '../../services/segmentBuilder.service.js';
import { buildSegmentName, buildSegmentDescription } from '../../utils/testData.js';
import fs   from 'fs';
import path from 'path';

const BLOCKED_FIELDS = [
  'account_number', 'phone_number', 'tin_number', 'email', 'customer_id'
];

function getSavedToken() {
  const file = path.resolve('.auth/token.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8')).token;
}

// =============================================================
// SCENARIO 1: VALIDATION (no database side effects)
// =============================================================
test.describe('Validation – segment payload & preview', () => {

  // ----------------------------------------------------------
  // Payload shape
  // ----------------------------------------------------------
  test.describe('Payload shape', () => {
    test('build() returns required structure', async ({ builder }) => {
      const payload = await builder.build();
      expect(payload.config).toBeDefined();
      expect(payload.audit).toBeDefined();
      expect(payload._meta).toBeDefined();
      expect(payload.serviceAudit).toBeDefined();
    });

    test('config structure is valid', async ({ builder }) => {
      const { config } = await builder.build();
      expect(config.table_name).toBeTruthy();
      expect(Array.isArray(config.attributes)).toBe(true);
      expect(config.attributes.length).toBeGreaterThan(0);
      expect(Array.isArray(config.target_metrics)).toBe(true);
      expect(config.target_metrics.length).toBeGreaterThan(0);
    });

    test('bin attributes have valid structure', async ({ builder }) => {
      const { config } = await builder.build();
      for (const attr of config.attributes) {
        expect(['bins', 'distinct_values']).toContain(attr.mode);
        if (attr.mode === 'bins') {
          for (const bin of attr.numeric_bins) {
            expect(typeof bin.min).toBe('number');
            expect(typeof bin.max).toBe('number');
            expect(bin.min).toBeLessThanOrEqual(bin.max);
            expect(typeof bin.label).toBe('string');
          }
        }
        if (attr.mode === 'distinct_values') {
          expect(attr.selected_values.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ----------------------------------------------------------
  // Preview API
  // ----------------------------------------------------------
  test.describe('previewSegment()', () => {
    test('returns valid response shape', async ({ builder, segmentAPI }) => {
      const { config } = await builder.build();
      const preview = await segmentAPI.previewSegment(config);
      expect(typeof preview.total_records).toBe('number');
      expect(preview.total_records).toBeGreaterThanOrEqual(0);
    });

    test('preview contains only primitive values', async ({ builder, segmentAPI }) => {
      const { config } = await builder.build();
      const preview = await segmentAPI.previewSegment(config);
      for (const row of (preview.data ?? [])) {
        for (const val of Object.values(row)) {
          const ok = val === null || typeof val === 'string' || typeof val === 'number';
          expect(ok).toBe(true);
        }
      }
    });
  });

  // ----------------------------------------------------------
  // Determinism
  // ----------------------------------------------------------
  test.describe('Determinism', () => {
    test('same seed → identical payload', async ({ seed }) => {
      const token = getSavedToken();
      const s1 = new SegmentBuilderService({ seed, token });
      const s2 = new SegmentBuilderService({ seed, token });
      await s1.init();
      await s2.init();
      const p1 = await s1.build();
      const p2 = await s2.build();
      expect(p1.config).toEqual(p2.config);
      await s1.dispose();
      await s2.dispose();
    });

    test('different seeds → different payloads', async ({ seed }) => {
      const token = getSavedToken();
      const s1 = new SegmentBuilderService({ seed, token });
      const s2 = new SegmentBuilderService({ seed: seed + 1, token });
      await s1.init();
      await s2.init();
      const p1 = await s1.build();
      const p2 = await s2.build();
      expect(JSON.stringify(p1.config)).not.toBe(JSON.stringify(p2.config));
      await s1.dispose();
      await s2.dispose();
    });

    test('resetSeed() produces identical re-run', async ({ builder }) => {
      const p1 = await builder.build();
      builder.resetSeed();
      const p2 = await builder.build();
      expect(p1.config).toEqual(p2.config);
    });
  });

  // ----------------------------------------------------------
  // Schema safety
  // ----------------------------------------------------------
  test.describe('Schema safety', () => {
    test('blocked fields are excluded', async ({ builder }) => {
      const { config } = await builder.build();
      const cols = [
        ...config.attributes.map(a => a.column_name),
        ...config.target_metrics.map(m => m.column_name)
      ];
      for (const col of cols) {
        expect(BLOCKED_FIELDS).not.toContain(col);
      }
    });

    test('all columns exist in schema', async ({ builder }) => {
      const payload = await builder.build();
      const nameSet = new Set(builder.columns.map(c => c.name));
      for (const attr of payload.config.attributes) {
        expect(nameSet.has(attr.column_name)).toBe(true);
      }
    });
  });

  // ----------------------------------------------------------
  // _meta validation
  // ----------------------------------------------------------
  test.describe('_meta validation', () => {
    test('meta contains replay data', async ({ builder, seed }) => {
      const { _meta } = await builder.build();
      expect(_meta.seed).toBe(seed);
      expect(_meta.schemaHash).toBe(builder.schemaHash);
      expect(_meta.reproducible).toBe(true);
      expect(_meta.replayCommand).toContain(String(seed));
    });

    test('serviceAudit covers all pipeline steps', async ({ builder }) => {
      const { serviceAudit } = await builder.build();
      expect(serviceAudit.steps).toHaveProperty('tableSelection');
      expect(serviceAudit.steps).toHaveProperty('schema');
      expect(serviceAudit.steps).toHaveProperty('AttributeSelector');
      expect(serviceAudit.steps).toHaveProperty('binning');
      expect(serviceAudit.steps).toHaveProperty('metrics');
    });
  });
});

// =============================================================
// SCENARIO 2: CREATE & READ (actual segment creation)
// =============================================================
test.describe('Create & Read – segment lifecycle', () => {
  test('creates segment with valid id', async ({ builder, segmentAPI, seed }) => {
    const payload = await builder.build();
    payload.config.name = buildSegmentName(payload.config.table_name, seed);
    payload.config.description = buildSegmentDescription(
      payload.config.table_name, seed, builder.schemaHash
    );
    const res = await segmentAPI.createSegment(payload.config);
    expect(res.id).toBeTruthy();
  });

  test('created segment exists in list', async ({ builder, segmentAPI, seed }) => {
    const payload = await builder.build();
    payload.config.name = buildSegmentName(payload.config.table_name, seed);
    const created = await segmentAPI.createSegment(payload.config);
    const list = await segmentAPI.getSegments();
    const segments = Array.isArray(list) ? list : list?.data ?? [];
    const found = segments.find(s => s.id === created.id);
    expect(found).toBeTruthy();
  });
});