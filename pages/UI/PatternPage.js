// =====================================================
// PatternPage.js (STABLE + PRODUCTION READY)
// =====================================================

import { BasePage } from '../base/BasePage.js';

// FIXED IMPORT (important)
import { PatternLocators } from '../locators/segment/pattern.locators.js';

class PatternPage extends BasePage {

  constructor(page) {
    super(page);
    this.locators = PatternLocators;

    // route validation helper
    this.patternRouteRegex =
      /\/picr\/segment-management\/\d+\/pattern\/\d+$/;
  }

  // =====================================================
  // NAVIGATION / PAGE STATE
  // =====================================================

  async waitForPageLoaded() {

    await this.page
      .locator(this.locators.header.title)
      .waitFor({ state: 'visible', timeout: 30000 });

    await this.waitForTableLoaded();
  }

  async waitForTableLoaded() {

    const rows = this.page.locator(
      this.locators.table.rows
    );

    await rows.first().waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.page.waitForLoadState('networkidle');
  }

  async waitForPatternRoute() {

    await this.page.waitForURL(
      this.patternRouteRegex,
      { timeout: 30000 }
    );
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  async getSegmentIdFromUrl() {

    const url = await this.getCurrentUrl();

    const match =
      url.match(/segment-management\/(\d+)\/pattern/);

    return match?.[1] ?? null;
  }

  async getPatternIdFromUrl() {

    const url = await this.getCurrentUrl();

    const match =
      url.match(/pattern\/(\d+)$/);

    return match?.[1] ?? null;
  }

  // =====================================================
  // HEADER
  // =====================================================

  async clickBack() {

    await Promise.all([
      this.page.waitForURL(/segment-management/),
      this.click(this.locators.header.backBtn),
    ]);
  }

  // =====================================================
  // DETAILS
  // =====================================================

  async getSegmentName() {
    return await this.getText(
      this.locators.details.segmentNameValue
    );
  }

  async getSegmentId() {
    return await this.getText(
      this.locators.details.segmentIdValue
    );
  }

  async getPatternId() {
    return await this.getText(
      this.locators.details.patternIdValue
    );
  }

  async getFieldValue(label) {
    return await this.getText(
      this.locators.details.fieldValue(label)
    );
  }

  // =====================================================
  // ATTRIBUTES
  // =====================================================

  async getAllAttributeChips() {

    await this.waitForPageLoaded();

    return await this.page
      .locator(this.locators.attributes.chips)
      .allInnerTexts();
  }

  async hasAttributeChip(text) {

    return await this.page
      .locator(
        this.locators.attributes.chipByText(text)
      )
      .isVisible();
  }

  // =====================================================
  // FILTERS
  // =====================================================

  async filterByLabel(label, value) {

    await this.fill(
      this.locators.filters.inputByLabel(label),
      value
    );

    await this.waitForNetworkIdle();
  }

  async clearSearch() {

    await this.clear(
      this.locators.filters.search
    );

    await this.waitForNetworkIdle();
  }

  // =====================================================
  // TABLE
  // =====================================================

  async getRowCount() {

    await this.waitForTableLoaded();

    return await this.getCount(
      this.locators.table.rows
    );
  }

  async clickViewButtonByRow(rowIndex = 0) {

    await Promise.all([
      this.page.waitForURL(this.patternRouteRegex),
      this.click(
        this.locators.rowActions.viewByRow(rowIndex)
      ),
    ]);

    await this.waitForTableLoaded();
  }

  async clickViewByLoanId(loanId) {

    await Promise.all([
      this.page.waitForURL(this.patternRouteRegex),
      this.click(
        this.locators.rowActions.viewByLoanId(loanId)
      ),
    ]);

    await this.waitForTableLoaded();
  }

  async getCellTextByRow(rowIndex, columnSelector) {

    const row = this.page
      .locator(this.locators.table.rows)
      .nth(rowIndex);

    await row.waitFor({
      state: 'visible',
      timeout: 30000
    });

    const cell = row.locator(columnSelector);

    return (await cell.innerText()).trim();
  }

  async getLoanId(rowIndex = 0) {

    return await this.getCellTextByRow(
      rowIndex,
      this.locators.table.columns.loanId
    );
  }

  async getCustomerId(rowIndex = 0) {

    return await this.getCellTextByRow(
      rowIndex,
      this.locators.table.columns.customerId
    );
  }

  async getProduct(rowIndex = 0) {

    return await this.getCellTextByRow(
      rowIndex,
      this.locators.table.columns.product
    );
  }

  async getStatusFromRow(rowIndex = 0) {

    return await this.getCellTextByRow(
      rowIndex,
      this.locators.table.columns.status
    );
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  async clickNextPage() {

    const current =
      await this.getCurrentPage();

    await this.click(
      this.locators.pagination.nextBtn
    );

    await this.page.waitForFunction(
      ([selector, prev]) =>
        document
          .querySelector(selector)
          ?.textContent
          ?.trim() !== prev,

      [
        this.locators.pagination.currentPage,
        current
      ]
    );

    await this.waitForTableLoaded();
  }

  async clickPreviousPage() {

    const current =
      await this.getCurrentPage();

    await this.click(
      this.locators.pagination.prevBtn
    );

    await this.page.waitForFunction(
      ([selector, prev]) =>
        document
          .querySelector(selector)
          ?.textContent
          ?.trim() !== prev,

      [
        this.locators.pagination.currentPage,
        current
      ]
    );

    await this.waitForTableLoaded();
  }

  async goToPage(pageNumber) {

    await Promise.all([
      this.page.waitForURL(this.patternRouteRegex),
      this.click(
        this.locators.pagination.pageButton(pageNumber)
      ),
    ]);

    await this.waitForTableLoaded();
  }

  async getCurrentPage() {

    return await this.getText(
      this.locators.pagination.currentPage
    );
  }

  async selectRowsPerPage(value) {

    await this.selectDropdown(
      this.locators.pagination.rowSizeDropdown,
      value
    );

    await this.waitForTableLoaded();
  }
}

export{ PatternPage };