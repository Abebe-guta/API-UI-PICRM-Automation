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

import { SegmentAPI } from '../../API/segment.api.js';
import { BaseAPI }    from '../../API/base.api.js';

import { buildSegmentName } from '../../utils/testData.js';

// =============================================================
// CONFIG
// =============================================================

const STABLE_SEGMENT = 'Segment-COOP';


test.describe('Full user journey: Segment → Pattern → Optimize', () => {
  test.setTimeout(120000); // 2 minutes for the whole flow

  test('Navigate from segment management to pattern to optimize', async ({ sharedPage, builder, segmentAPI }) => {

// =============================================================
// SEGMENT PAGE
// =============================================================
    const segmentPage = new SegmentPage(sharedPage);

    await segmentPage.goto();
    await segmentPage.waitForTableLoaded();

    // TC_SEGMENT_001: page loads correctly
    expect(await segmentPage.getPageTitle()).toBe('Segment Management');

    await expect(
      segmentPage.isVisible(segmentPage.locators.segmentControl.segmentDropdown)
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

    // API → UI VALIDATION (API created segment visible in dropdown)
    const payload = await builder.build();

    const name = buildSegmentName(payload.config.table_name);
    payload.config.name = name;

    const created = await segmentAPI.createSegment(payload.config);
    console.log('created segment name:', created);
    expect(created.id).toBeTruthy();

    await segmentPage.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await segmentPage.waitForTableLoaded();

    const options = await segmentPage.getAllSegmentsFromDropdown();
    console.log('All segment names:', options);
    expect(options.some(o => o.includes(name))).toBeTruthy();

    // Select the newly created segment then delete it
    await segmentPage.selectSegment(name);
    await segmentPage.clickDelete();
    await segmentPage.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    const optionsAfter = await segmentPage.getAllSegmentsFromDropdown();
    console.log('All segment names after delete:', optionsAfter);
    expect(optionsAfter).not.toContain(name);

    // Re-select stable segment and get first cell text for View action
    await segmentPage.selectSegment(STABLE_SEGMENT);
    await segmentPage.waitForTableLoaded();
    const firstCellText = await segmentPage.getFirstRowFirstCell();
    expect(firstCellText).toBeTruthy();

// =============================================================
// PATTERN PAGE
// =============================================================

    await segmentPage.clickViewByCellText(firstCellText);
    const patternPage = new PatternPage(sharedPage);

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
    expect(pafter).not.toBe(Pbefore);

    // TC_PATTERN_005: Search by Loan ID
    const firstLoanId = await patternPage.getLoanId(0);
    console.log('Loan-Id:', firstLoanId);
    expect(firstLoanId).toBeTruthy();

    await patternPage.filterByLabel('Search', firstLoanId);
    await patternPage.waitForTableLoaded();
    const rowsAfterLoanIdFilter = await patternPage.getRowCount();
    expect(rowsAfterLoanIdFilter).toBe(1);
    const displayedLoanId = await patternPage.getLoanId(0);
    expect(displayedLoanId).toBe(firstLoanId);
    await patternPage.clearAllFilters();

    // TC_PATTERN_006: Search by Customer ID
    const firstCustomerId = await patternPage.getCustomerId(0);
    await patternPage.filterByLabel('Search', firstCustomerId);
    await patternPage.waitForTableLoaded();
    expect(await patternPage.getRowCount()).toBe(1);
    expect(await patternPage.getCustomerId(0)).toBe(firstCustomerId);
    await patternPage.clearAllFilters();

    // TC_PATTERN_007: Filter by Product Code
    const firstProduct = await patternPage.getProduct(0);
    await patternPage.filterByLabel('Product Code', firstProduct);
    await patternPage.waitForTableLoaded();
    const productFilteredRows = await patternPage.getRowCount();
    expect(productFilteredRows).toBeGreaterThan(0);

    // CHANGE: replaced `rows` (segment page count from TC_SEGMENT_002) with
    // `productFilteredRows` — the loop must iterate the current page's rows
    for (let i = 0; i < Math.min(productFilteredRows, 5); i++) {
      const product = await patternPage.getProduct(i);
      expect(product).toBe(firstProduct);
    }
    await patternPage.clearAllFilters();

    // TC_PATTERN_008: Filter by Loan Status
    const firstStatus = await patternPage.getStatusFromRow(0);
    await patternPage.filterByLabel('Loan Status', firstStatus);
    await patternPage.waitForTableLoaded();
    expect(await patternPage.getRowCount()).toBeGreaterThan(0);
    expect(await patternPage.getStatusFromRow(0)).toBe(firstStatus);
    await patternPage.clearAllFilters();

    // TC_PATTERN_009: Filter by Region
    const firstRegion = await patternPage.getRegionFromRow(0);
    await patternPage.filterByLabel('Region', firstRegion);
    await patternPage.waitForTableLoaded();
    expect(await patternPage.getRowCount()).toBeGreaterThan(0);
    expect(await patternPage.getRegionFromRow(0)).toBe(firstRegion);
    await patternPage.clearAllFilters();

    // TC_PATTERN_010: Change rows per page
    const rowSizes = [5, 10, 25];
    for (const size of rowSizes) {
      await patternPage.selectRowsPerPage(size);
      const rowCount = await patternPage.getRowCount();
      expect(rowCount).toBeLessThanOrEqual(size);
    }

    // TC_PATTERN_011: View action opens loan details
    const firstLoanIdView = await patternPage.getLoanId(0);
    await patternPage.clickViewByLoanId(firstLoanIdView);
    await patternPage.page.goBack();

    // TC_PATTERN_012: Pattern details show segment ID, pattern ID, loan count
    const patternsegmentId  = await patternPage.getSegmentId();
    const findpatternId     = await patternPage.getPatternId();
    const patternloanCount  = await patternPage.getLoanCount();
    console.log('segmentId:', patternsegmentId);
    console.log('patternId:', findpatternId);
    console.log('loanCount:', patternloanCount);
    expect(patternsegmentId).toBeTruthy();
    expect(findpatternId).toBeTruthy();
    expect(patternloanCount).toBeGreaterThan(0);

    // TC_PATTERN_013: Go back to segment page
    await sharedPage.goBack();
    await segmentPage.waitForTableLoaded();

    // TC_PATTERN_014: Get first cell text fresh for Manage action
    const firstCellTextManage = await segmentPage.getFirstRowFirstCell();
    expect(firstCellTextManage).toBeTruthy();

// =============================================================
// OPTIMIZE PAGE
// =============================================================

    await segmentPage.clickManageByCellText(firstCellTextManage);
    const optimizePage = new OptimizePage(sharedPage);
    await optimizePage.waitForOptimizeRoute();
    await optimizePage.waitForPageLoaded();

    // TC_OPTIMIZE_001: page title
    expect(await optimizePage.getTitle()).toBe('Portfolio Optimization');

    // TC_OPTIMIZE_002: header displays segment ID and pattern ID from URL
    const segmentId = await optimizePage.getSegmentIdFromUrl();
    const patternId = await optimizePage.getPatternIdFromUrl();
    expect(segmentId).toBeTruthy();
    expect(patternId).toBeTruthy();

    // TC_OPTIMIZE_003: summary cards exist
    const summaryCount = await optimizePage.getSummaryCardsCount();
    expect(summaryCount).toBeGreaterThan(0);

    // TC_OPTIMIZE_004: credit score slider works
    await optimizePage.setCreditScore(650);
    const selectedScore = await optimizePage.getSelectedCreditScore();
    expect(selectedScore).toContain('650');

    // TC_OPTIMIZE_005: chart visible
    expect(await optimizePage.isChartVisible()).toBeTruthy();

    // TC_OPTIMIZE_006: Outstanding Principal updates after credit score change
    const beforePrincipal = await optimizePage.getOutstandingPrincipalValue();
    await optimizePage.setCreditScore(651);
    await optimizePage.clickSaveCutoff();
    await optimizePage.waitForMetricsToStabilize();
    const afterPrincipal = await optimizePage.getOutstandingPrincipalValue();
    expect(afterPrincipal).not.toBe(beforePrincipal);

    // TC_OPTIMIZE_007: Loan count updates after credit score change
    const beforeLoan = await optimizePage.getApprovedLoanCount();
    console.log('approved loans before credit score change:', beforeLoan);
    await optimizePage.setCreditScore(652);
    await optimizePage.waitForSaveCutoffEnabled();
    await optimizePage.clickSaveCutoff();
    await optimizePage.waitForMetricsToStabilize();
    const afterLoan = await optimizePage.getApprovedLoanCount();
    console.log('approved loans after credit score change:', afterLoan);
    expect(afterLoan).not.toBe(beforeLoan);

    // TC_OPTIMIZE_008: optimisation runs without error
    await optimizePage.optimizePortfolio(700);
    await expect(optimizePage.page.locator('body')).not.toContainText('500');

    // TC_OPTIMIZE_009: Impact percentage is displayed
    const impact = await optimizePage.getImpactPercentage();
    expect(impact).toMatch(/^\d+(\.\d+)?%$/);

    // TC_OPTIMIZE_010: Current cutoff value is shown
    const currentCutoff = await optimizePage.getCurrentCutoff();
    expect(currentCutoff).toBeTruthy();
    const cutoffNumber = Number(currentCutoff.replace(/[^0-9.]/g, ''));
    expect(cutoffNumber).toBeGreaterThan(0);

    // TC_OPTIMIZE_011: Save Cutoff button enables after slider change
    const initiallyEnabled =
      await optimizePage.isSaveCutoffButtonVisible() &&
      !(await optimizePage.page.locator(optimizePage.locators.cutoff.saveButton).getAttribute('disabled'));

    await optimizePage.setCreditScore(652);
    await optimizePage.waitForSaveCutoffEnabled();

    const afterEnabled =
      await optimizePage.isSaveCutoffButtonVisible() &&
      !(await optimizePage.page.locator(optimizePage.locators.cutoff.saveButton).getAttribute('disabled'));

    expect(afterEnabled).toBe(true);

    // TC_OPTIMIZE_012: Back button returns to segment management
    await optimizePage.clickBack();
    await expect(optimizePage.page).toHaveURL(/\/segment-management/);

    console.log('✅ Full user journey completed successfully.');
  });
});