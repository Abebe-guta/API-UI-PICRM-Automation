// =============================================================
// tests/DB/segment.db.spec.js
// =============================================================

import { test, expect } from "../../fixtures/base.fixture.js";

import {
  getSegmentById,
  segmentExists,
  getSegmentAttributes,
  getSegmentMetrics,
} from "../../db/segment.db.js";

test.describe("DB – Segment Persistence", () => {
  // ==========================================================
  // CREATE
  // ==========================================================
  test("created segment exists in database", async ({
    builder,
    segmentAPI,
  }) => {
    const payload = await builder.build();
    payload.config.name = `DB_Test_${Date.now()}`;

    const created = await segmentAPI.createSegment(payload.config);
    console.log("CREATE RESPONSE:", JSON.stringify(created));

    console.log("Querying DB with id:", created.id);

    const segment = await getSegmentById(created.id);
    console.log("DB QUERY RESPONSE:", JSON.stringify(segment));

    expect(segment).not.toBeNull();
    expect(segment.id).toBe(created.id);
    expect(segment.name).toBe(payload.config.name);
    expect(segment.status).toBe("active");
  });

  // ==========================================================
  // DELETE
  // ==========================================================
  test("deleted segment is removed from database", async ({
    builder,
    segmentAPI,
  }) => {
    const payload = await builder.build();
    payload.config.name = `DB_Delete_${Date.now()}`;

    const created = await segmentAPI.createSegment(payload.config);
    console.log("FULL CREATE RESPONSE:", JSON.stringify(created));

    // use segmentExists() before delete to confirm it was created
    const existsBefore = await segmentExists(created.id);
    expect(existsBefore).toBe(true);

    await segmentAPI.deleteSegment(created.id);

    // use segmentExists() after delete — cleaner than getSegmentById + null check
    const existsAfter = await segmentExists(created.id);
    expect(existsAfter).toBe(false);
  });

  // ==========================================================
  // ATTRIBUTES
  // ==========================================================
  test("segment attributes match payload", async ({ builder, segmentAPI }) => {
    const payload = await builder.build();
    payload.config.name = `DB_Attr_${Date.now()}`;

    const created = await segmentAPI.createSegment(payload.config);

    const dbAttributes = await getSegmentAttributes(created.id);
    const dbColumns = dbAttributes.map((a) => a.column_name);
    const payloadColumns = payload.config.attributes.map((a) => a.column_name);

    console.log("DB columns:", dbColumns);
    console.log("Payload columns:", payloadColumns);

    for (const col of payloadColumns) {
      expect(dbColumns).toContain(col);
    }
    const removedAttr = await segmentAPI.deleteSegment(created.id);
    console.log("Removed attribute:", removedAttr);
  });

  // ==========================================================
  // METRICS
  // ==========================================================
  test("metric column names match payload", async ({ builder, segmentAPI }) => {
    const payload = await builder.build();
    payload.config.name = `DB_Metric_${Date.now()}`;

    const created = await segmentAPI.createSegment(payload.config);

    const dbMetrics = await getSegmentMetrics(created.id);
    const dbColumnNames = dbMetrics.map((m) => m.column_name);
    const payloadColumns = payload.config.target_metrics.map(
      (m) => m.column_name,
    );

    console.log("DB metric columns:", dbColumnNames);
    console.log("Payload metric columns:", payloadColumns);

    for (const col of payloadColumns) {
      expect(dbColumnNames).toContain(col);
    }
    const removedMetric = await segmentAPI.deleteSegment(created.id);
    console.log("Removed metric:", removedMetric);
  });
});
