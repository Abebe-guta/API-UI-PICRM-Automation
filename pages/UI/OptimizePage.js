// =====================================================
// OptimizePage.js (STABLE + PRODUCTION READY)
// =====================================================

import { BasePage } from '../base/BasePage.js';
import { OptimizePageLocators } from '../locators/segment/optimize.locators.js';

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

  async getOutstandingPrincipalValue() {

    const box = this.page.locator(
      this.locators.filteredMetrics.outstandingBox
    );

    await box.waitFor({
      state: 'visible',
      timeout: 30000
    });

    return (
      await box
        .locator('p.text-lg, p.text-xl, p.text-2xl')
        .first()
        .innerText()
    ).trim();
  }

  async getApprovedAmountValue() {

    const box = this.page.locator(
      this.locators.filteredMetrics.approvedBox
    );

    await box.waitFor({
      state: 'visible',
      timeout: 30000
    });

    return (
      await box
        .locator('p.text-lg, p.text-xl, p.text-2xl')
        .first()
        .innerText()
    ).trim();
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

    await this.click(
      this.locators.cutoff.saveButton
    );

    await this.waitForNetworkIdle();
  }

  async isSaveCutoffButtonVisible() {

    return await this.isVisible(
      this.locators.cutoff.saveButton
    );
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