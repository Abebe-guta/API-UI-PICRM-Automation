// =====================================================
// OptimizePage.js (STABLE + PRODUCTION READY)
// =====================================================

import { BasePage } from '../base/BasePage.js';
import { OptimizePageLocators } from '../locators/segment/optimize.locators.js';
import { expect } from 'playwright/test';

class OptimizePage extends BasePage {

  constructor(page) {
    super(page);
    this.locators = OptimizePageLocators;

    this.optimizeRouteRegex =
      /\/segment-management\/\d+\/pattern\/\d+\/optimize/;
  }

  // =====================================================
  // PAGE
  // =====================================================

  async waitForPageLoaded() {

    await this.page
      .locator(this.locators.header.title)
      .waitFor({
        state: 'visible',
        timeout: 30000
      });

    await this.waitForNetworkIdle();
  }

  async waitForOptimizeRoute() {

    await this.page.waitForURL(
      this.optimizeRouteRegex,
      { timeout: 30000 }
    );
  }

  // =====================================================
  // URL HELPERS
  // =====================================================

  async getSegmentIdFromUrl() {

    const url = this.page.url();

    return url.match(
      /segment-management\/(\d+)\/pattern/
    )?.[1] ?? null;
  }

  async getPatternIdFromUrl() {

    const url = this.page.url();

    return url.match(
      /pattern\/(\d+)\/optimize/
    )?.[1] ?? null;
  }

  async getOptimizeUrlDetails() {

    const url = this.page.url();

    const match = url.match(
      /segment-management\/(\d+)\/pattern\/(\d+)\/optimize/
    );

    return {
      segmentId: match?.[1] ?? null,
      patternId: match?.[2] ?? null,
    };
  }

  async verifyOptimizeUrl() {

    await this.page.waitForURL(
      this.optimizeRouteRegex,
      { timeout: 30000 }
    );
  }

  // =====================================================
  // HEADER
  // =====================================================

  async getTitle() {

    return await this.getText(
      this.locators.header.title
    );
  }

  async getSubtitle() {

    return await this.getText(
      this.locators.header.subtitle
    );
  }

  async clickBack() {

    await Promise.all([
      this.page.waitForURL(/segment-management/),
      this.click(this.locators.header.backBtn),
    ]);
  }

  // =====================================================
  // SUMMARY
  // =====================================================

  async getSummaryCardValue(label) {

    return await this.getText(
      this.locators.summary.valueByLabel(label)
    );
  }

  async getSummaryCardsCount() {

    return await this.getCount(
      this.locators.summary.cards
    );
  }

  async isSummaryCardVisible(label) {

    return await this.isVisible(
      this.locators.summary.cardByLabel(label)
    );
  }

  // =====================================================
  // CREDIT FILTER
  // =====================================================

  async setCreditScore(value) {

    const slider = this.page.locator(
      this.locators.creditFilter.slider
    );

    await slider.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await slider.fill(String(value));
    // Ensure the change event is triggered (fill already does both input and change)
   await this.page.waitForTimeout(500); // allow debounce


    await this.waitForNetworkIdle();
   }

   async getSelectedCreditScore() {

    return await this.getText(
      this.locators.creditFilter.selectedValue
    );
   }

   async getMinimumCreditScore() {

    return await this.getText(
      this.locators.creditFilter.minValue
    );
   }

   async getMaximumCreditScore() {

    return await this.getText(
      this.locators.creditFilter.maxValue
    );
   }

   // =====================================================
   // FILTERED METRICS (STABILIZED)
   // =====================================================
   async getMetricValue(cardLocator){
    const container=this.page.locator(this.locators.filteredMetrics.container);
    const card=container.locator(cardLocator);
    const count=await card.count();
      if (count === 0) {
    throw new Error(
      `Metric card not found: ${cardLocator}`
    );
   }
    if (count > 1) {
    throw new Error(
      `Multiple metric cards found: ${cardLocator}`
    );
   }
    await card.first().waitFor({
    state: 'visible',
    timeout: 30000
   });
   // Amount is the bold value
   const value = card.first().locator('p.font-bold');

   const valueCount = await value.count();

   if (valueCount === 0) {
    throw new Error(`Metric value missing for: ${cardLocator}`  
    );
    }

   return (await value.first().innerText()).trim();
   }

   async getOutstandingPrincipalValue() {

    return await this.getMetricValue(
    this.locators.filteredMetrics.outstandingBox
   );
   }

   async getApprovedAmountValue() {

   return await this.getMetricValue(
    this.locators.filteredMetrics.approvedBox
   );
   }
    async getApprovedLoanCount() {
   const container = this.page.locator(
    this.locators.filteredMetrics.container
   );

   const loanText = container.locator(
    this.locators.filteredMetrics.loanCountText
   );

   await loanText.first().waitFor({
    state: 'visible',
    timeout: 30000
   });

   const text = (
    await loanText.first().innerText()
   ).trim();

   if (!text.includes('loans with credit score')) {
    throw new Error(
      `Unexpected loan count text: ${text}`
    );
   }

   // Extract number
   const match = text.match(/[\d,]+/);

   if (!match) {
    throw new Error(
      `Could not extract loan count from: ${text}`
    );
   }

   // Return as number
   return Number(match[0].replace(/,/g, ''));
   }


   // =====================================================
   // IMPACT ANALYSIS
   // =====================================================

   async getImpactPercentage() {

    return await this.getText(
      this.locators.impact.percentageValue
    );
   }

   async isChartVisible() {

    return await this.isVisible(
      this.locators.impact.svg
    );
   }

   async isImpactSectionVisible() {

    return await this.isVisible(
      this.locators.impact.section
    );
   }

   async isExcludedLegendVisible() {

    return await this.isVisible(
      this.locators.impact.legend.excluded
    );
   }

   async isWithCutoffLegendVisible() {

    return await this.isVisible(
      this.locators.impact.legend.withCutoff
    );
   }

   // =====================================================
   // CUT-OFF PANEL
   // =====================================================

   async getCurrentCutoff() {

    return await this.getText(
      this.locators.cutoff.currentValue
    );
   }

   async getCutoffImpactPercentage() {

    return await this.getText(
      this.locators.cutoff.impactPercentage
    );
   }

   async clickSaveCutoff() {
   const saveButtonSelector = this.locators.cutoff.saveButton;
   const saveButton = this.page.locator(saveButtonSelector);

   await expect(saveButton).toBeVisible();
   await expect(saveButton).toBeEnabled();

   await saveButton.click();

   await expect(
    this.page.getByText('Cutoff updated successfully!')
   ).toBeVisible({ timeout: 10000 });
   }

   async isSaveCutoffButtonVisible() {

    return await this.isVisible(
      this.locators.cutoff.saveButton
    );
   }
   async waitForMetricsToStabilize() {

   const container = this.page.locator(
    this.locators.filteredMetrics.container
   ).first();

   await expect(container).toBeVisible();

   // wait for DOM stability (no layout shift)
   await expect(container).toHaveCount(1);

   // ensure rendering is complete
   await this.page.waitForLoadState('networkidle');

   // final micro-buffer for JS rendering
   await this.page.waitForTimeout(200);
   }
   //===========
   //HELPER
   //===========
   async waitForSaveCutoffEnabled(timeout = 5000) {
   const saveButton = this.page.locator(this.locators.cutoff.saveButton);
   await expect(saveButton).toBeEnabled({ timeout });
   }

   // =====================================================
   // BUSINESS FLOW
   // =====================================================

   async optimizePortfolio(score) {

    await this.setCreditScore(score);

    await this.clickSaveCutoff();

    await this.waitForNetworkIdle();
   }
 }

export{ OptimizePage };