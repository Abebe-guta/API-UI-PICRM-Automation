// =============================================================
// pages/UI/SegmentPage.js
// =============================================================

import { BasePage } from '../base/BasePage';
import { SegmentLocators } from '../locators/segment/segment.locators';

class SegmentPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = SegmentLocators;
    this.url = '/picr/segment-management';
  }

  // ===========================================================
  // NAVIGATION
  // ===========================================================
async goto() {
  console.log('\n📍 [SegmentPage] Navigating to Segment Manager...');

  // 1. Click the parent "Segment Manager" button to expand the sub‑menu
  const parentButton = this.page.locator('button:has-text("Segment Manager")');
  await parentButton.waitFor({ state: 'visible', timeout: 30000 });
  console.log('✅ Found parent "Segment Manager" button');
  
  // Check if sub‑menu is already expanded? (optional)
  const isExpanded = await parentButton.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await parentButton.click();
    await this.page.waitForTimeout(500); // allow animation
    console.log('✅ Expanded sub‑menu');
  }

  // 2. Now the direct link inside the sub‑menu becomes visible
  const segmentLink = this.page.locator('a[href="/picr/segment-management"]');
  await segmentLink.waitFor({ state: 'visible', timeout: 30000 });
  console.log('✅ Found "Segments" link');

  // 3. Click and wait for navigation
  await Promise.all([
    this.page.waitForURL('**/segment-management', { timeout: 60000 }),
    segmentLink.click(),
  ]);

  await this.waitForPageLoaded();
  console.log('✅ Segment page ready');
}

  async waitForPageLoaded() {
    await this.page.locator(this.locators.headers.title).waitFor({ state: 'visible', timeout: 60000 });
  }

  // ===========================================================
  // PAGE INFO
  // ===========================================================
  async getPageTitle() {
    return await this.getText(this.locators.headers.title);
  }

  async getSubtitle() {
    return await this.getText(this.locators.headers.subtitle);
  }

  async clickCreateSegment() {
    await this.click(this.locators.headers.createSegmentBtn);
    await this.page.waitForTimeout(1000);
  }

  // ===========================================================
  // SEGMENT CONTROLS
  // ===========================================================
  async selectSegment(segmentName) {
    const dropdown = this.page.locator(this.locators.segmentControl.segmentDropdown).first();
    await dropdown.waitFor({ state: 'visible', timeout: 30000 });
    await dropdown.selectOption(segmentName);
    await this.waitForTableLoaded();
    console.log(`✅ Selected segment: ${segmentName}`);
  }

  async getAllSegmentsFromDropdown() {
    const dropdown = this.page.locator(this.locators.segmentControl.segmentDropdown).first();
    await dropdown.waitFor({ state: 'visible', timeout: 30000 });
    const options = await dropdown.locator('option').allTextContents();
    return options.filter(opt => opt && opt.trim() !== '');
  }

  async getSelectedSegment() {
    const dropdown = this.page.locator(this.locators.segmentControl.segmentDropdown).first();
    return await dropdown.inputValue();
  }

  async selectRandomSegment() {
    const options = await this.getAllSegmentsFromDropdown();
    if (options.length === 0) throw new Error('No segments found');
    const randomIndex = Math.floor(Math.random() * options.length);
    const selected = options[randomIndex];
    await this.selectSegment(selected);
    console.log(`🎲 Randomly selected: ${selected}`);
    return selected;
  }

  async clickDuplicate() {
    await this.click(this.locators.segmentControl.duplicateBtn);
    await this.waitForTableLoaded();
  }

  async clickRecompute() {
    await this.click(this.locators.segmentControl.recomputeBtn);
    await this.waitForTableLoaded();
  }

  async clickDelete() {
    await this.click(this.locators.segmentControl.deleteBtn);
  }

  // ===========================================================
  // TABLE OPERATIONS
  // ===========================================================
  async waitForTableLoaded() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1500);
    await this.page.locator(this.locators.table.body).waitFor({ state: 'visible', timeout: 30000 });
  }

  async getRowCount() {
    return await this.page.locator(this.locators.row.rows).count();
  }

  async getAllRows() {
    return await this.page.locator(this.locators.row.rows).all();
  }

  async getCellText(rowIndex, columnIndex = 0) {
    const rows = this.page.locator(this.locators.row.rows);
    const row = rows.nth(rowIndex);
    return await row.locator('td').nth(columnIndex).textContent();
  }

  async getFirstRowFirstCell() {
    return await this.page.locator('tbody tr td').first().textContent();
  }

  // ===========================================================
  // FILTER OPERATIONS
  // ===========================================================
  async filterByColumn(columnName, value) {
    const filterInput = this.locators.filter.byColumn(columnName);
    await this.page.locator(filterInput).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(filterInput).fill(value);
    await this.page.keyboard.press('Enter');
    await this.waitForTableLoaded();
    console.log(`✅ Filtered ${columnName}: ${value}`);
  }

  async filterByRandomColumn(value) {
    const inputs = this.page.locator(this.locators.filter.allInputs);
    const count = await inputs.count();
    if (count === 0) return null;
    const randomIndex = Math.floor(Math.random() * count);
    const selected = inputs.nth(randomIndex);
    let columnName = 'Unknown';
    try {
      const header = selected.locator('xpath=ancestor::th');
      columnName = await header.locator('span').first().textContent() || 'Unknown';
    } catch (e) {}
    await selected.fill(value);
    await this.page.keyboard.press('Enter');
    await this.waitForTableLoaded();
    console.log(`✅ Filtered random column "${columnName}" with ${value}`);
    return columnName;
  }

  async clearFilter(columnName) {
    const filterInput = this.locators.filter.byColumn(columnName);
    await this.page.locator(filterInput).clear();
    await this.page.keyboard.press('Enter');
    await this.waitForTableLoaded();
  }

  async clearAllFilters() {
    const inputs = this.page.locator(this.locators.filter.allInputs);
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).clear();
    }
    await this.page.keyboard.press('Enter');
    await this.waitForTableLoaded();
    console.log('✅ Cleared all filters');
  }

  async filterByStatus(status) {
    await this.selectDropdown(this.locators.filter.statusDropdown, status);
    await this.waitForTableLoaded();
  }

  // ===========================================================
  // ROW OPERATIONS
  // ===========================================================
  async clickViewOnRow(rowIndex) {
    const rows = this.page.locator(this.locators.row.rows);
    const row = rows.nth(rowIndex);
    await row.locator(this.locators.row.viewBtn).click();
    console.log(`✅ Clicked View on row ${rowIndex}`);
  }

  async clickManageOnRow(rowIndex) {
    const rows = this.page.locator(this.locators.row.rows);
    const row = rows.nth(rowIndex);
    await row.locator(this.locators.row.manageBtn).click();
    console.log(`✅ Clicked Manage on row ${rowIndex}`);
  }

  async clickViewByCellText(cellText) {
    await this.waitForTableLoaded();
    const cell = this.page.locator(this.locators.cell.byText(cellText)).first();
    await cell.waitFor({ state: 'visible', timeout: 15000 });
    const row = cell.locator('xpath=ancestor::tr');
    const viewBtn = row.locator(this.locators.row.viewBtn);
    await viewBtn.waitFor({ state: 'visible', timeout: 5000 });
    await viewBtn.click();
    console.log(`✅ Clicked View on row with text: ${cellText}`);
  }

  async clickManageByCellText(cellText) {
    await this.waitForTableLoaded();
    const cell = this.page.locator(this.locators.cell.byText(cellText)).first();
    await cell.waitFor({ state: 'visible', timeout: 10000 });
    const row = cell.locator('xpath=ancestor::tr');
    const manageBtn = row.locator(this.locators.row.manageBtn);
    await manageBtn.waitFor({ state: 'visible', timeout: 5000 });
    await manageBtn.click();
    console.log(`✅ Clicked Manage on row with text: ${cellText}`);
  }

  async getRowStatus(rowIndex) {
    const rows = this.page.locator(this.locators.row.rows);
    const row = rows.nth(rowIndex);
    if (await row.locator(this.locators.row.statusActive).isVisible()) return 'Active';
    if (await row.locator(this.locators.row.statusOptimized).isVisible()) return 'Optimized';
    if (await row.locator(this.locators.row.statusBlocked).isVisible()) return 'Blocked';
    return 'Unknown';
  }

  // ===========================================================
  // PAGINATION
  // ===========================================================
  async selectRowsPerPage(count) {
    await this.selectDropdown(this.locators.pagination.rowsPerPageDropdown, count.toString());
    await this.waitForTableLoaded();
  }

  async clickNextPage() {
    const btn = this.page.locator(this.locators.pagination.nextBtn);
    const disabled = await btn.getAttribute('disabled');
    if (disabled !== null) return false;
    await btn.click();
    await this.waitForTableLoaded();
    return true;
  }

  async clickPreviousPage() {
    const btn = this.page.locator(this.locators.pagination.prevBtn);
    const disabled = await btn.getAttribute('disabled');
    if (disabled !== null) return false;
    await btn.click();
    await this.waitForTableLoaded();
    return true;
  }

  async goToPage(pageNumber) {
    const btn = this.page.locator(this.locators.pagination.pageBtn(pageNumber));
    await btn.click();
    await this.waitForTableLoaded();
  }

  async getCurrentPage() {
    const current = this.page.locator(this.locators.pagination.currentPage);
    if (await current.isVisible().catch(() => false)) return await current.textContent();
    const active = this.page.locator('button[aria-current="page"]');
    if (await active.isVisible().catch(() => false)) return await active.textContent();
    return '1';
  }

  // ===========================================================
  // UTILITIES
  // ===========================================================
  async isVisible(locator) {
    return await this.page.locator(locator).isVisible();
  }

  async getText(locator) {
    return await this.page.locator(locator).textContent();
  }

  async click(locator) {
    await this.page.locator(locator).click();
  }

  async selectDropdown(locator, value) {
    await this.page.locator(locator).selectOption(value);
  }

  async getCount(locator) {
    return await this.page.locator(locator).count();
  }
}

export{ SegmentPage };