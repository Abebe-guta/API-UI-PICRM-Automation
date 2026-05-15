// =============================================================
// tests/ui/segment.e2e.spec.js
// TIER: UI — Full E2E lifecycle (PRODUCTION READY)
//
// FLOW:
//   Segment page loads
//   → Select segment → table populates
//   → Table interactions (filter, sort, paginate)
//   → View row → Pattern page
//   → Pattern interactions
//   → Manage row → Optimize page
//   → Optimize interactions
//
// ARCHITECTURE: POM-based clean enterprise structure
// =============================================================

import { test, expect } from '../../fixtures/base.fixture.js';

import { SegmentPage }  from '../../pages/UI/SegmentPage.js';
import { PatternPage }  from '../../pages/UI/PatternPage.js';
import { OptimizePage } from '../../pages/UI/OptimizePage.js';

import { SegmentAPI } from '../../api/segment.api.js';
import { BaseAPI }    from '../../api/base.api.js';

import { buildSegmentName } from '../../utils/testData.js';

// =============================================================
// CONFIG
// =============================================================

const BASE_URL = process.env.BASE_URL ?? 'http://3.216.34.218:9192/picr';
const PAGE_URL = `${BASE_URL}/picr/segment-management`;

const STABLE_SEGMENT = 'Segment-COOP';


test.describe('Full user journey: Segment → Pattern → Optimize', () => {
   test.setTimeout(120000); // 2 minutes for the whole flow

  test('Navigate from segment management to pattern to optimize', async ({sharedPage,builder, segmentAPI, seed }) => {
    
// =============================================================
// SEGMENT PAGE
// =============================================================
    const segmentPage = new SegmentPage(sharedPage );

    await segmentPage.goto();

    await segmentPage.waitForTableLoaded();

     // TC_SEGMENT_001: page loads correctly
    expect(await segmentPage.getPageTitle())
      .toBe('Segment Management');

    await expect(
      segmentPage.isVisible(
        segmentPage.locators.segmentControl.segmentDropdown
      )
    ).resolves.toBeTruthy();
   
    // TC_SEGMENT_002: select stable segment and verify rows
    await segmentPage.selectSegment(STABLE_SEGMENT);

    await segmentPage.waitForTableLoaded();

    const rows = await segmentPage.getRowCount();

    expect(rows).toBeGreaterThan(0);
    // TC_SEGMENT_003: select random segment (Smoke)

    const selected = await segmentPage.selectRandomSegment();

    const newrows = await segmentPage.getRowCount();

    expect(newrows).toBeGreaterThanOrEqual(0);

    console.log('Selected segment:', selected);

    // TC_SEGMENT_004: test column filter
    await segmentPage.selectSegment(STABLE_SEGMENT);

    const initial = await segmentPage.getRowCount();

    const column = await segmentPage.filterByRandomColumn('ZZZ_NO_MATCH');

    const filtered = await segmentPage.getRowCount();

    expect(filtered).toBeLessThanOrEqual(initial);

    console.log(`Filtered using column: ${column}`);

    await segmentPage.clearAllFilters();

    // TC_SEGMENT_005: test pagination

    await segmentPage.selectSegment(STABLE_SEGMENT);

    const before = await segmentPage.getCurrentPage();

    await segmentPage.clickNextPage();

    const after = await segmentPage.getCurrentPage();

    expect(after).not.toBe(before);

   // API → UI VALIDATION (API created segment visible)
    const payload = await builder.build();

    const name = buildSegmentName(
      payload.config.table_name,
      seed
    );

    payload.config.name = name;

    const created = await segmentAPI.createSegment(payload.config);
    console.log("created segment name:",created)

    expect(created.id).toBeTruthy();

    await segmentPage.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    await segmentPage.waitForTableLoaded();

   const options = await segmentPage.getAllSegmentsFromDropdown();
    console.log("All sgement name:",options)

    expect(options.some(o => o.includes(name))).toBeTruthy();

    //Select the newly created segment from the dropdown
    await segmentPage.selectSegment(name);
   // Click the Delete button
    await segmentPage.clickDelete();
    await segmentPage.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    const optionsfter = await segmentPage.getAllSegmentsFromDropdown();
    console.log("All sgement name:",optionsfter)
    expect(optionsfter).not.toContain(name);

    // re-select stable segemnt and re-fetch first cell text
    
    await segmentPage.selectSegment(STABLE_SEGMENT);
    await segmentPage.waitForTableLoaded();
    const firstCellText = await segmentPage.getFirstRowFirstCell();
    expect(firstCellText).toBeTruthy();

// =============================================================
// PATTERN PAGE
// =============================================================
   //click View on first row of selected segment

    await segmentPage.clickViewByCellText(firstCellText);
    const patternPage = new PatternPage(sharedPage );

    await patternPage.waitForPatternRoute();

    await patternPage.waitForPageLoaded();

    // TC_PATTERN_001: page loads
    expect(await patternPage.getSegmentName()).toBeTruthy();
    // TC_PATTERN_002: attributes exist
    const chips = await patternPage.getAllAttributeChips();
    expect(chips.length).toBeGreaterThan(0);
  
    // TC_PATTERN_003: table has data
    const prows = await patternPage.getRowCount();
    expect(prows).toBeGreaterThan(0);
   // TC_PATTERN_004: pagination works
    const Pbefore = await patternPage.getCurrentPage();

    await patternPage.clickNextPage();

    const pafter = await patternPage.getCurrentPage();

    expect(pafter).not.toBe(before);
       // TC_PATTERN_005: Go back to segment page
    await sharedPage.goBack();
    await segmentPage.waitForTableLoaded();

    // TC_PATTERN_006: Get first cell text *fresh* for Manage action (table may have changed)
    const firstCellTextManage = await segmentPage.getFirstRowFirstCell();
    expect(firstCellTextManage).toBeTruthy();

// =============================================================
// OPTIMIZE PAGE
// =============================================================

    await segmentPage.clickManageByCellText(firstCellTextManage);
    const optimizePage=new OptimizePage(sharedPage );
    await optimizePage.waitForOptimizeRoute();

    await optimizePage.waitForPageLoaded();
  
   // TC_OPTIMIZE_001: page title
    expect(await optimizePage.getTitle())
      .toBe('Portfolio Optimization');
   // TC_OPTIMIZE_002: summary cards exist
    const count = await optimizePage.getSummaryCardsCount();
    expect(count).toBeGreaterThan(0);

    // TC_OPTIMIZE_003: credit score slider works
    await optimizePage.setCreditScore(650);

    const value = await optimizePage.getSelectedCreditScore();

    expect(value).toContain('650');
   
    // TC_OPTIMIZE_004: chart visible
    expect(await optimizePage.isChartVisible()).toBeTruthy();

    // TC_OPTIMIZE_005: optimisation runs without error
    await optimizePage.optimizePortfolio(700);

    await expect(
      optimizePage.page.locator('body')
    ).not.toContainText('500');
  
console.log('✅ Full user journey completed successfully.');
});
});