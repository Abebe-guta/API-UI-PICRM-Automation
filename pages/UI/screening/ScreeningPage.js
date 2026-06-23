import { ScreeningLocators } from "../../locators/screening/ScreeningLocators.js";
import { BasePage } from "../../base/BasePage.js";
import { ScreeningResponseHandler } from "./ScreeningResponseHandler.js";

class ScreeningPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = ScreeningLocators;
    this.url = "/picr/screening";
    this.responseHandler = new ScreeningResponseHandler(page);
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  async goto() {
    const parentButton = this.page.locator('button:has-text("Screening")');
    await parentButton.waitFor({ state: "visible", timeout: 30000 });

    if ((await parentButton.getAttribute("aria-expanded")) !== "true") {
      await parentButton.click();
      await this.page.waitForTimeout(300);
    }

    const screeningLink = this.page.locator('a[href="/picr/screening"]');
    await screeningLink.waitFor({ state: "visible", timeout: 10000 });

    await Promise.all([
      this.page.waitForURL("**/screening", { timeout: 60000 }),
      screeningLink.click(),
    ]);

    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await this.waitForVisible(this.locators.headers.title, 60000);
  }

  async getPageTitle() {
    return await this.getText(this.locators.headers.title);
  }

  // =====================================================
  // FORM ACTIONS
  // =====================================================

  async fillCustomerId(customerId) {
    await this.fill(this.locators.inputs.customerId, String(customerId));
  }

  async fillSegmentId(segmentId) {
    await this.fillAndTab(this.locators.inputs.segmentId, segmentId);
  }

  async fillSegmentName(segmentName) {
    await this.fillAndTab(this.locators.inputs.segmentName, segmentName);
  }

  async submitSearch() {
    await this.click(this.locators.actions.searchBtn);
  }

  async resetFormState() {
    await this.resetForm(
      [
        this.locators.inputs.customerId,
        this.locators.inputs.segmentId,
        this.locators.inputs.segmentName,
      ],
      this.locators.results.root, // waits for results card to hide
    );
  }

  // =====================================================
  // HIGH LEVEL SEARCH FLOWS
  // =====================================================

  async searchBySegmentId(customerId, segmentId, timeout = 60000) {
    await this.resetFormState();

    await this.fillCustomerId(customerId);
    await this.fillSegmentId(segmentId);
    await this.submitSearch();
    const response = await this.submitAndWaitForResponse(
      () => this.submitSearch(),
      "/screening",
      timeout,
    );

    return this.responseHandler.normalizeResponse(response);
  }

  async searchBySegmentName(customerId, segmentName, timeout = 60000) {
    await this.resetFormState();

    const response = await this.submitAndWaitForResponse(
      () => this.submitSearch(),
      "/screening",
      timeout,
    );

    await this.fillCustomerId(customerId);
    await this.fillSegmentName(segmentName);
    await this.submitSearch();

    return this.responseHandler.normalizeResponse(response);
  }

  // =====================================================
  // UI DATA EXTRACTION
  // =====================================================

  async captureResults() {
    const L = this.locators.results;

    const status = await this.page
      .getByText("Customer is in segment", { exact: false })
      .or(this.page.getByText("Customer is not in segment", { exact: false }))
      .first()
      .innerText()
      .catch(() => null);

    return {
      status,
      customerId: await this.readText(L.customerId),
      segmentId: await this.readText(L.segmentId),
      segmentName: await this.readText(L.segmentName),
      segmentRowId: await this.readText(L.segmentRowId),
      patternStatus: await this.readText(L.patternStatus),
      riskScore: await this.readText(L.riskScore),
      riskTier: await this.readText(L.riskTier),
      footerMessage: await this.readText(L.footerMessage),
    };
  }

  // =====================================================
  // HELPERS
  // =====================================================

  async getSegmentValidationMessage() {
    return await this.getTextContent(this.locators.validation.missingSegment);
  }
}
export { ScreeningPage };
