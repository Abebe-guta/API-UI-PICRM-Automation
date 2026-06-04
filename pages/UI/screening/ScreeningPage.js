import { ScreeningLocators } from "../../locators/screening/ScreeningLocators.js";
import { BasePage } from "../../base/BasePage.js";

class ScreeningPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = ScreeningLocators;
    this.url = "/picr/screening";
    this.searchTriggered = false;
  }

  // ===============================
  // NAVIGATION
  // ===============================
  async goto() {
    const parentButton = this.page.locator('button:has-text("Screening")');
    await parentButton.waitFor({ state: "visible", timeout: 30000 });

    if ((await parentButton.getAttribute("aria-expanded")) !== "true") {
      await parentButton.click();
      await this.page.waitForTimeout(300);
    }

    const screeningLink = this.page.locator('a[href="/picr/screening"]');
    await screeningLink.waitFor({ state: "visible", timeout: 30000 });

    await Promise.all([
      this.page.waitForURL("**/screening", { timeout: 60000 }),
      screeningLink.click(),
    ]);

    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await this.page
      .locator(this.locators.headers.title)
      .waitFor({ state: "visible", timeout: 60000 });
  }

  async getPageTitle() {
    return await this.getText(this.locators.headers.title);
  }

  // ===============================
  // FORM ACTIONS
  // ===============================
  async fillCustomerId(customerId) {
    await this.page
      .locator(this.locators.inputs.customerId)
      .fill(String(customerId));
  }

  async fillSegmentId(segmentId) {
    const el = this.page.locator(this.locators.inputs.segmentId);
    await el.fill(String(segmentId));
    await el.press("Tab");
  }

  async fillSegmentName(segmentName) {
    const el = this.page.locator(this.locators.inputs.segmentName);
    await el.fill(String(segmentName));
    await el.press("Tab");
  }

  async submitSearch() {
    this.searchTriggered = true;
    await this.page.locator(this.locators.actions.searchBtn).click();
  }

  // ===============================
  // RESET
  // ===============================
  async resetFormState() {
    if (!this.page || this.page.isClosed?.()) return;

    await this.page.locator(this.locators.inputs.customerId).fill("");
    await this.page.locator(this.locators.inputs.segmentId).fill("");
    await this.page.locator(this.locators.inputs.segmentName).fill("");
    await this.page.locator(this.locators.inputs.customerId).press("Tab");
    // reset state
    this.searchTriggered = false;
  }

  // ===============================
  // HIGH LEVEL FLOWS
  // ===============================
  async searchBySegmentId(customerId, segmentId, timeout = 60000) {
    await this.resetFormState();
    await this.fillCustomerId(customerId);
    await this.fillSegmentId(segmentId);
    await this.submitSearch();
    return await this.waitForResults(timeout);
  }

  async searchBySegmentName(customerId, segmentName, timeout = 60000) {
    await this.resetFormState();
    await this.fillCustomerId(customerId);
    await this.fillSegmentName(segmentName);
    await this.submitSearch();
    return await this.waitForResults(timeout);
  }

  // ===============================
  // RESULTS RESOLUTION (FIXED)
  // ===============================
  async waitForResults(timeout = 60000) {
    // CHANGE 1: Capture API response
    const responsePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes("/screening") && res.request().method() === "POST",
      { timeout },
    );

    await this.submitSearch();

    const response = await responsePromise;

    let json;
    try {
      json = await response.json();
    } catch (e) {
      throw new Error("[waitForResults] Failed to parse JSON response");
    }
    console.log("🔎 SCREENING API RESPONSE:", JSON.stringify(json, null, 2));

    // Normalize ALL backend response variations
    if (json.detail) {
      return {
        state: "error",
        message: json.detail,
        data: json,
      };
    }

    // ❌ SOFT ERROR CASE
    if (json.error) {
      return {
        state: "error",
        message: json.error,
        data: json,
      };
    }

    // ⚠️ validation / business rejection
    if (json.success === false) {
      return {
        state: "validation",
        message: json.message,
        data: json,
      };
    }
    // SUCCESS CASE normalization
    if (typeof json.in_segment === "boolean") {
      return {
        state: json.in_segment ? "results" : "not-in-segment",
        data: json,
      };
    }
    // fallback (never break test silently)
    return {
      state: "unknown",
      message: "Unexpected response structure",
      data: json,
    };
  }
  // ===============================
  // DATA EXTRACTION (UNCHANGED)
  // ===============================
  async captureResults() {
    const root = this.page.locator(this.locators.results.root);
    await root.waitFor({ state: "visible", timeout: 15000 });

    const result = {};

    const rows = root.locator("div.space-y-2");
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);

      const label = await row
        .locator("label")
        .textContent()
        .catch(() => null);
      const value = await row
        .locator("p, span")
        .first()
        .textContent()
        .catch(() => null);

      if (!label || !value) continue;

      const key = label.trim().toLowerCase().replace(/\s+/g, "_");

      result[key] = value.trim();
    }

    const status = await this.page
      .locator("text=Customer is in segment")
      .or(this.page.locator("text=Customer is not in segment"))
      .first()
      .textContent()
      .catch(() => null);

    result.status = status;

    return result;
  }

  async getSegmentValidationMessage() {
    const el = this.page.locator(this.locators.validation.missingSegment);
    await el.waitFor({ state: "visible", timeout: 10000 });

    return (await el.textContent())?.trim();
  }
}

export { ScreeningPage };
