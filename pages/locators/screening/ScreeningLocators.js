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
  // ─────────────────────────────────────────────────────────────
  // DOM structure per field:
  //   <div class="space-y-2">
  //     <label>Field Name</label>
  //     <p>value</p>                    ← most fields
  //   </div>
  //   <div class="space-y-2">
  //     <label>Pattern Status</label>
  //     <div><span>Active</span></div>  ← extra wrapper div
  //   </div>
  //
  // FIX 1: root anchored on h2 — covers the whole card, not one field
  // FIX 2: :has-text() not :text() — correct Playwright pseudo-class
  // FIX 3: scoped to div.space-y-2 wrapper then query child —
  //         survives extra wrapper elements, no direct child > needed
  // FIX 4: statusText anchored inside results card — no loose >> chain
  // =========================
  results: {
    // Anchor for the whole results card
    root: 'h2:has-text("Screening Results")',

    // Status span anchored inside the results header row
    statusText: 'h2:has-text("Screening Results") ~ div span.font-medium',

    // Field values — scoped to their div.space-y-2 wrapper
    customerId: 'div.space-y-2:has(label:has-text("Customer ID")) p',
    segmentId: 'div.space-y-2:has(label:has-text("Segment ID")) p',
    segmentName: 'div.space-y-2:has(label:has-text("Segment Name")) p',
    segmentRowId: 'div.space-y-2:has(label:has-text("Segment Row ID")) p',

    // Pattern Status: <span> badge in-segment, <p> "Not available" otherwise
    patternStatus:
      'div.space-y-2:has(label:has-text("Pattern Status")) :is(span.rounded-full, p)',

    riskScore: 'div.space-y-2:has(label:has-text("Risk Score")) p',
    riskTier: 'div.space-y-2:has(label:has-text("Risk Tier")) p',

    // Footer info banner
    footerMessage: "div.bg-blue-50 p",
  },
};
