export const OptimizePageLocators = {
  // =========================
  // PAGE ROOT
  // =========================
  page: {
    root: 'div.space-y-6',
  },

  // =========================
  // HEADER SECTION
  // =========================
  header: {
    root: 'div:has(h1:text-is("Portfolio Optimization"))',

    backBtn: 'button:has-text("Back")',

    title: 'h1:text-is("Portfolio Optimization")',

    subtitle: 'p.text-muted-foreground',
  },

  // =========================
  // SUMMARY METRICS (TOP CARDS)
  // =========================
  summary: {
    container: 'div.grid.grid-cols-1.md\\:grid-cols-3',

    cards: 'div.grid.grid-cols-1.md\\:grid-cols-3 > div.card',

    cardByLabel: (label) =>
      `div.card:has(p:text-is("${label}"))`,

    valueByLabel: (label) =>
      `div.card:has(p:text-is("${label}")) p.text-xl`,
  },

  // =========================
  // CREDIT SCORE FILTER
  // =========================
  creditFilter: {
    section:
      'div.card:has(h3:text-is("Credit Score Filter"))',

    title: 'h3:text-is("Credit Score Filter")',

    description:
      'div.card:has(h3:text-is("Credit Score Filter")) p.text-sm',

    slider: 'input[type="range"]',

    // labels row (Minimum / Selected / Maximum)
    minLabel: 'span:text-matches("Minimum.*")',
    selectedLabel: 'span:text-matches("Selected.*")',
    maxLabel: 'span:text-matches("Maximum.*")',

    // values (more stable than raw text)
    minValue: 'span:text-matches("Minimum:.*")',
    selectedValue: 'span:text-matches("Selected:.*")',
    maxValue: 'span:text-matches("Maximum:.*")',
  },

  // =========================
  // FILTERED METRICS (POST SLIDER CARDS)
  // =========================
  filteredMetrics: {
    container: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4',

    outstandingBox:
      'div.card:has-text("Total Outstanding Principal")',

    approvedBox:
      'div.card:has-text("Total Approved Amount")',

    loanCountText:
      'text=loans with credit score',
  },

  // =========================
  // IMPACT ANALYSIS (CHART SECTION)
  // =========================
  impact: {
    section:
      'div.card:has(h4:text-is("Impact Analysis"))',

    title: 'h4:text-is("Impact Analysis")',

    description:
      'div.card:has(h4:text-is("Impact Analysis")) p.text-sm',

    chartContainer: 'div.recharts-responsive-container',

    svg: 'svg.recharts-surface[role="application"]',

    legend: {
      container: 'div.recharts-legend-wrapper',

      excluded:
        'div.recharts-legend-wrapper text=Excluded',

      withCutoff:
        'div.recharts-legend-wrapper text=With Cutoff',
    },

    percentageValue:
      'div.card:has(h4:text-is("Impact Analysis")) div.mt-4.text-center p.text-2xl',

    percentageText:
      'text=of total approved amount',
  },

  // =========================
  // CUT-OFF SUMMARY PANEL (RIGHT CARD)
  // =========================
  cutoff: {
    section:
      'div.card:has(p:text-is("Current Cutoff"))',

    currentValue:
      'div.card:has(p:text-is("Current Cutoff")) p.text-3xl',

    impactPercentage:
      'div.card:has(p:text-is("Impact Percentage")) p.text-2xl',

    saveButton: 
     'button:has-text("Save Cutoff"), button:has-text("Update Cutoff")'

  },

  // =========================
  // GLOBAL ACTIONS
  // =========================
  actions: {
    saveCutoff: 'button:has-text("Save Cutoff")',
  },
};
