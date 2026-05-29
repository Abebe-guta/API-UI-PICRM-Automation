// =============================================================
// BasePage.js (UPDATED - ENTERPRISE STABLE VERSION)
// PURPOSE:
//   Shared resilient Playwright utilities
//   Used by all Page Objects
// =============================================================

import { expect } from '@playwright/test';

export class BasePage {

  constructor(page) {
    this.page = page;
  }

  // =====================================================
  // LOCATORS
  // =====================================================

  locator(selector) {
    return this.page.locator(selector).first();
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  async goto(url, options = {}) {

    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
      ...options
    });

    await this.waitForPageReady();
  }

  // =====================================================
  // PAGE STATE
  // =====================================================

  async waitForPageReady() {

    await this.page.waitForLoadState(
      'networkidle'
    );
  }

  async waitForNetworkIdle() {

    await this.page.waitForLoadState(
      'networkidle'
    );
  }

  async waitForDOMReady() {

    await this.page.waitForLoadState(
      'domcontentloaded'
    );
  }

  // =====================================================
  // AUTH VALIDATION
  // =====================================================

  async verifyAuthenticated() {

    if (this.page.url().includes('/login')) {

      throw new Error(
        `❌ Authentication failed.\n` +
        `Redirected to login page:\n${this.page.url()}`
      );
    }
  }

  // =====================================================
  // ELEMENT ACTIONS
  // =====================================================

  async click(selector, options = {}) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await element.click(options);
  }

  async fill(selector, value, options = {}) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await element.fill(value, options);
  }

  async clear(selector) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await element.clear();
  }

  async press(selector, key) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await element.press(key);
  }

  async hover(selector) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await element.hover();
  }

  // =====================================================
  // TEXT / CONTENT
  // =====================================================

  async getText(selector) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    return (
      await element.innerText()
    ).trim();
  }

  async getTextContent(selector) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'visible',
      timeout: 30000
    });

    return (
      await element.textContent()
    )?.trim();
  }

  async getAttribute(selector, attribute) {

    const element = this.locator(selector);

    await element.waitFor({
      state: 'attached',
      timeout: 30000
    });

    return await element.getAttribute(attribute);
  }

  // =====================================================
  // VISIBILITY / STATE
  // =====================================================

 async isVisible(selector) {
  const locator = typeof selector === 'string' 
    ? this.page.locator(selector) 
    : selector;
  return await locator.isVisible();
 }

 async isHidden(selector) {
  const locator = typeof selector === 'string'
    ? this.page.locator(selector)
    : selector;
  return await locator.isHidden();
 }

 async isEnabled(selector) {
  const locator = typeof selector === 'string'
    ? this.page.locator(selector)
    : selector;
  return await locator.isEnabled();
}

  // =====================================================
  // DROPDOWNS
  // =====================================================

  async selectDropdown(
    selector,
    value
  ) {

    const dropdown = this.locator(selector);

    await dropdown.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await dropdown.selectOption(String(value));

    await this.waitForNetworkIdle();
  }

  // =====================================================
  // COUNTS
  // =====================================================

  async getCount(selector) {

    return await this.locator(selector)
      .count();
  }

  // =====================================================
  // TABLE HELPERS
  // =====================================================

  async getRowByCellText(rowSelector, text) {

    return this.page.locator(rowSelector).filter({
        has: this.page.locator(`td:text-is("${text}")`),
      });
  }
  async clickRowAction({rowSelector,rowText, actionSelector,}) 
  {
    const row =
      await this.getRowByCellText(rowSelector,rowText);

    await row.locator(actionSelector).waitFor({
        state: 'visible',
        timeout: 30000
      });

    await row.locator(actionSelector).click();
    await this.waitForNetworkIdle();
  }

  // =====================================================
  // WAIT HELPERS
  // =====================================================

  async waitForVisible(
    selector,
    timeout = 30000
  ) {

    await this.locator(selector)
      .waitFor({
        state: 'visible',
        timeout
      });
  }

  async waitForHidden(
    selector,
    timeout = 30000
  ) {

    await this.locator(selector)
      .waitFor({
        state: 'hidden',
        timeout
      });
  }

  async waitForText(selector,expected,timeout = 30000) 
  {
    await expect(this.locator(selector)).toContainText(expected, 
      {
      timeout
    });
  }

  // =====================================================
  // DEBUGGING
  // =====================================================

  async screenshot(name = 'debug') {

    await this.page.screenshot({
      path: `.artifacts/${name}.png`,
      fullPage: true
    });
  }

  async debugPageState() {

    if (!process.env.DEBUG) {
      return;
    }

    console.log({
      url: this.page.url(),
      title: await this.page.title(),
      hasToken: await this.page.evaluate(
        () => !!localStorage.getItem('token')
      )
    });
  }
}
