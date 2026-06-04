export const ScreeningLocators = {
  // =========================
  // HEADER
  // =========================
  headers: {
    title: 'h1:has-text("Customer Screening")',
    subtitle:
      "text=Check if a customer is in a segment and view their risk score and segment status",
    resultsTitle: 'h2:has-text("Screening Results")',
  },

  // =========================
  // INPUTS
  // =========================
  inputs: {
    customerId: "#customer-id",
    segmentId: "#segment-id",
    segmentName: "#segment-name",
  },

  // =========================
  // ACTION BUTTONS
  // =========================
  actions: {
    searchBtn: 'button:has-text("Check Customer")',
  },

  // =========================
  // VALIDATION MESSAGES
  // =========================
  validation: {
    missingSegment: "text=Please enter either Segment ID or Segment Name",
    segmentNotFound: "text=Segment not found",
    invalidCustomer: "text=Invalid customer ID",
  },

  // =========================
  // RESULTS SECTION
  // =========================
  results: {
    root: 'div:has(label:text("Customer ID"))',

    customerId: 'div:has(label:text("Customer ID")) > p',

    segmentId: 'div:has(label:text("Segment ID")) > p',

    segmentName: 'div:has(label:text("Segment Name")) > p',

    segmentRowId: 'div:has(label:text("Segment Row ID")) > p',

    riskScore: 'div:has(label:text("Risk Score")) > p',

    riskTier: 'div:has(label:text("Risk Tier")) > p',

    patternStatus: 'div:has(label:text("Pattern Status")) span',

    statusText: "div.flex.items-center.gap-2 >> span",

    footerMessage: "div.bg-blue-50 p",
  },
};
