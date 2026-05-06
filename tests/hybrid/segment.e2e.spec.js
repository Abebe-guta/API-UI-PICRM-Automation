// =============================================================
// tests/hybrid/segment.e2e.spec.js
// =============================================================

import { test, expect }  from '../../fixtures/base.fixture.js';
import { SegmentBuilderService } from '../../services/segmentBuilder.service.js';
import { logRun }        from '../../utils/auditLogger.js';
import { buildSegmentName, buildSegmentDescription } from '../../utils/testData.js';
import fs   from 'fs';
import path from 'path';

const UI_BASE = process.env.BASE_URL ?? 'http://localhost:3000';

function getSavedToken() {
  const file = path.resolve('.auth/token.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8')).token;
}

// =============================================================
// GROUP: FULL E2E FLOW
// =============================================================
test.describe('Segment E2E — API-first full flow', () => {

  // ----------------------------------------------------------
  // TEST 1: Golden path
  // ----------------------------------------------------------
  test('build → preview → create → verify', async ({
    page, builder, segmentAPI, seed, runLabel
  }, testInfo) => {

    let payload      = null;
    let previewRes   = null;
    let createRes    = null;
    let status       = 'failed';
    let errorMessage = null;

    try {
      // PHASE 1: BUILD
      payload = await builder.build();
      expect(payload.config.attributes.length).toBeGreaterThan(0);
      expect(payload.config.target_metrics.length).toBeGreaterThan(0);
      expect(payload._meta.seed).toBe(seed);

      payload.config.name        = buildSegmentName(payload.config.table_name, seed);
      payload.config.description = buildSegmentDescription(
        payload.config.table_name, seed, builder.schemaHash
      );

      // PHASE 2: PREVIEW VIA API
      previewRes = await segmentAPI.previewSegment(payload.config);
      expect(Array.isArray(previewRes.data)).toBe(true);
      expect(typeof previewRes.total_records).toBe('number');

      // PHASE 3: CREATE VIA API
      createRes = await segmentAPI.createSegment(payload.config);
      expect(createRes.id).toBeTruthy();

      // PHASE 4: VERIFY VIA API
      const list     = await segmentAPI.getSegments();
      const segments = Array.isArray(list) ? list : list?.data ?? [];
      const found    = segments.find(s => s.id === createRes.id);
      expect(found).toBeTruthy();

      // PHASE 5: VERIFY VIA UI (smoke only)
      await page.goto(`${UI_BASE}/segments`);
      await expect(
        page.locator(`text=${payload.config.name}`).first()
      ).toBeVisible({ timeout: 15_000 });

      status = 'passed';

    } catch (err) {
      errorMessage = err.message;
      status       = 'failed';
      throw err;

    } finally {
      try {
        const { auditPath, snapshotPath } = logRun({
          seed,
          schemaHash:   builder.schemaHash,
          table:        builder.table,
          payload,
          serviceAudit: payload?.serviceAudit ?? {},
          apiResponse:  createRes,
          schema:       builder.columns,
          status,
          errorMessage,
          tags: ['e2e', 'hybrid', `seed:${seed}`]
        });
        testInfo.annotations.push({ type: 'auditLog',       description: auditPath });
        testInfo.annotations.push({ type: 'schemaSnapshot', description: snapshotPath });
        console.info(`\n🔁 Replay: SEED=${seed} npx playwright test tests/hybrid/segment.e2e.spec.js\n`);
      } catch (auditErr) {
        console.warn('⚠️ Audit write failed:', auditErr.message);
      }
    }
  });

  // ----------------------------------------------------------
  // TEST 2: Preview contract shape
  // ----------------------------------------------------------
  test('previewSegment() returns correct contract shape', async ({ builder, segmentAPI }) => {
    const payload = await builder.build();
    const preview = await segmentAPI.previewSegment(payload.config);
    expect(Array.isArray(preview.data)).toBe(true);
    expect(typeof preview.total_records).toBe('number');
  });

  // ----------------------------------------------------------
  // TEST 3: Determinism end-to-end
  // ----------------------------------------------------------
  test('same seed → identical payloads + preview counts', async ({ seed, segmentAPI }) => {
    const token = getSavedToken();
    const s1    = new SegmentBuilderService({ seed, token });
    const s2    = new SegmentBuilderService({ seed, token });
    await s1.init();
    await s2.init();
    const p1 = await s1.build();
    const p2 = await s2.build();
    expect(p1.config.attributes).toEqual(p2.config.attributes);
    expect(p1.config.target_metrics).toEqual(p2.config.target_metrics);
    const pr1 = await segmentAPI.previewSegment(p1.config);
    const pr2 = await segmentAPI.previewSegment(p2.config);
    expect(pr1.total_records).toBe(pr2.total_records);
    await s1.dispose();
    await s2.dispose();
  });

  // ----------------------------------------------------------
  // TEST 4: Schema drift detection
  // ----------------------------------------------------------
  test('schemaHash is stable within the run', async ({ builder }) => {
    const snap1 = builder.snapshot();
    await builder.build();
    const snap2 = builder.snapshot();
    expect(snap1.schemaHash).toBe(snap2.schemaHash);
    expect(snap1.table).toBe(snap2.table);
  });

  // ----------------------------------------------------------
  // TEST 5: Audit record completeness
  // ----------------------------------------------------------
  test('audit record contains everything needed to replay', async ({ builder, seed }) => {
    const payload = await builder.build();
    const { buildAuditRecord } = await import('../../utils/auditLogger.js');
    const record = buildAuditRecord({
      seed,
      schemaHash:   builder.schemaHash,
      table:        builder.table,
      payload,
      serviceAudit: payload.serviceAudit,
      status:       'passed',
      tags:         ['e2e']
    });
    expect(record.replay.seed).toBe(seed);
    expect(record.replay.schemaHash).toBe(builder.schemaHash);
    expect(record.replay.reproducible).toBe(true);
    expect(record.replay.command).toContain(String(seed));
    expect(record.pipeline.steps).toHaveProperty('tableSelection');
    expect(record.pipeline.steps).toHaveProperty('schema');
    expect(record.pipeline.steps).toHaveProperty('AttributeSelector');
    expect(record.pipeline.steps).toHaveProperty('binning');
    expect(record.pipeline.steps).toHaveProperty('metrics');
  });

});