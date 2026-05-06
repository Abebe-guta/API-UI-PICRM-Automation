// =============================================================
// tests/ui/segment.smoke.spec.js
// =============================================================

import { test, expect } from '../../fixtures/base.fixture.js';
import { buildSegmentName } from '../../utils/testData.js';

const UI_BASE = process.env.BASE_URL ?? 'http://localhost:3000';

let createdSegment;
let segmentName;

test.describe('Segment UI — smoke', () => {

  test('segments list page loads without errors', async ({ page }) => {
    await page.goto(`${UI_BASE}/segments`);
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(
      page.locator('[data-testid="segments-list"], h1').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('segment created via API appears in UI list', async ({ page, builder, segmentAPI, seed }) => {
    const payload = await builder.build();
    segmentName   = buildSegmentName(payload.config.table_name, seed);
    payload.config.name = segmentName;

    createdSegment = await segmentAPI.createSegment(payload.config);
    expect(createdSegment.id).toBeTruthy();

    await page.goto(`${UI_BASE}/segments`);
    await expect(
      page.locator(`text=${segmentName}`).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('segment detail page renders', async ({ page }) => {
    test.skip(!createdSegment?.id, 'Skipped — no segment created in prior test');
    await page.goto(`${UI_BASE}/segments/${createdSegment.id}`);
    await expect(page.locator('body')).not.toContainText('404');
    await expect(
      page.locator(`text=${segmentName}`).first()
    ).toBeVisible({ timeout: 10_000 });
  });

});