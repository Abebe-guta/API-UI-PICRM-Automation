// =============================================================
// pattern.locators.js
// FULLY UPDATED - STABLE + SCALABLE + PLAYWRIGHT SAFE
// =============================================================

export const PatternLocators = {

  // =========================================================
  // PAGE ROOT
  // =========================================================

  page: {
    root: 'div.space-y-6',
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {

    // safer semantic anchor
    root: 'div:has(h1)',

    // FIXED:
    // original mismatch:
    // root searched "Pattern Details"
    // title searched "Pattern Borrowers"
    title: 'h1:text-is("Pattern Borrowers")',

    subtitle:
      'div.card p.text-muted-foreground',

    backBtn:
      'button:has-text("Back")',
  },

  // =========================================================
  // PATTERN DETAILS CARD
  // =========================================================

  details: {

    card:
      'div.card:has(h2:text-is("Pattern Details"))',

    // generic field resolver
    fieldValue: (label) =>
      `div:has(> div:text-is("${label}")) + div`,

    // stable predefined fields
    segmentNameValue:
      'div:has(> div:text-is("Segment Name")) + div',

    segmentIdValue:
      'div:has(> div:text-is("Segment ID")) + div',

    patternIdValue:
      'div:has(> div:text-is("Pattern ID")) + div',
  },

  // =========================================================
  // ATTRIBUTES / CHIPS
  // =========================================================

  attributes: {

    container:
      'div:has(div:text-is("Pattern Attributes"))',

    chips:
      'div:has(div:text-is("Pattern Attributes")) span',

    chipByText: (text) =>
      `div:has(div:text-is("Pattern Attributes")) span:text-is("${text}")`,
  },

  // =========================================================
  // METRICS / STATUS
  // =========================================================

  metrics: {

    loanCountValue:
      'div:has(div:text-is("Loan Count")) + div',

    statusBadge:
      'div:has(div:text-is("Status")) span',
  },

  // =========================================================
  // FILTERS
  // =========================================================

  filters: {

    // stable card anchor
    root:
      'div.card:has(label:text-is("Search"))',

    // scalable resolver
    inputByLabel: (labelText) =>
      `div:has(label:text-is("${labelText}")) input`,

    // predefined convenience selectors
    search:
      'div:has(label:text-is("Search")) input',

    productCode:
      'div:has(label:text-is("Product Code")) input',

    loanStatus:
      'div:has(label:text-is("Loan Status")) input',

    region:
      'div:has(label:text-is("Region")) input',

    // actions
    actionsBar:
      'div.border-t.border-gray-200',

    chips:
      'div.border-t.border-gray-200 span',

    clearFiltersBtn:
      'button:has-text("Clear filters")',
  },

  // =========================================================
  // TABLE
  // =========================================================

  table: {

    root: 'table',

    container:
      'div.overflow-x-auto',

    headerRow:
      'thead tr',

    headers:
      'thead th',

    body:
      'tbody',

    rows:
      'tbody tr',

    emptyState:
      'tbody tr td:text-matches("No data|No records", "i")',

    loadingSpinner:
      '.animate-spin',

    // =====================================================
    // GENERIC HELPERS
    // =====================================================

    columnByIndex: (index) =>
      `td:nth-child(${index + 1})`,

    rowByText: (text) =>
      `tbody tr:has(td:text-is("${text}"))`,

    cellByText: (text) =>
      `td:text-is("${text}")`,

    // =====================================================
    // STABLE SEMANTIC COLUMNS
    // =====================================================

    columns: {

      loanId:
        'td:nth-child(1)',

      customerId:
        'td:nth-child(2)',

      product:
        'td:nth-child(3)',

      balance:
        'td:nth-child(4)',

      status:
        'td:nth-child(5) span',

      region:
        'td:nth-child(6)',

      actions:
        'td:nth-child(7)',
    },

    // optional future-proof semantic helper
    cellByHeader: (headerText) =>
      `td:has(+ td):has-text("${headerText}")`,

    viewButton:
      'button:has-text("View")',
  },

  // =========================================================
  // PAGINATION
  // =========================================================

  pagination: {

    root:
      'div:has(button[aria-label="Next page"])',

    rowSizeDropdown:
      '#page-size',

    prevBtn:
      'button[aria-label="Previous page"]',

    nextBtn:
      'button[aria-label="Next page"]',

    pageButton: (page) =>
      `button[aria-label="Go to page ${page}"]`,

    currentPage:
      'button[aria-current="page"]',

    pageInfo:
      'div:has-text("Showing")',
  },

  // =========================================================
  // ROW ACTIONS
  // =========================================================

  rowActions: {

    viewByRow: (rowIndex = 0) =>
      `tbody tr:nth-child(${rowIndex + 1}) button:has-text("View")`,

    viewByLoanId: (loanId) =>
      `tr:has(td:text-is("${loanId}")) button:has-text("View")`,
  },

  // =========================================================
  // VALIDATION HELPERS
  // =========================================================

  validation: {

    pageLoaded:
      'h1:text-is("Pattern Borrowers")',

    tableLoaded:
      'tbody tr',

    authenticated:
      'body',
  },
};

