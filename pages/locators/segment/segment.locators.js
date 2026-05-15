 export const SegmentLocators={
    // =========================
  // HEADER
  // =========================
  headers:{
     title:'h1:has-text("Segment Management")',
     subtitle:'text=Create, edit, and analyze credit risk segments',
     createSegmentBtn:'button:has-text("Create Segment")',
},
  // =========================
  // SEGMENT CONTROLS
  // =========================
  segmentControl:{
     segmentDropdown: 'label:has-text("Select Segment") + div select',
     duplicateBtn:'button:has-text("Duplicate")',
     recomputeBtn:'button:has-text("Recompute")',
     deleteBtn:'button:has-text("Delete")',
  },
    // ===============
  // TABLE CONTAINER
  // ===============
  table:{
    root:'table',
    header:'thead',
    body:'tbody',
    row:'tbody tr',
  },
  // ================================
  // COLUMN FILTERS (DYNAMIC SCOPED )
  // =================================
  filter:{
    /*Get filter input by column name*/
     
    byColumn: (columnName) =>
      `thead th:has(span:has-text("${columnName}")) input`,
     /* fallback: all filter inputs (if needed for bulk operations)*/
     
     allInputs: 'thead input',
     statusDropdown: 'thead th:has(span:text-is("Status")) select',
  },
  // =============================
  // ROW LEVEL ACTIONS (DYNAMIC CONTEXT)
  // ========================
  row: {
     rows: 'tbody tr',
     viewBtn: 'button:has-text("View")',
     manageBtn: 'button:has-text("Manage")',

     statusActive: 'span:has-text("Active")',
     statusOptimized: 'span:has-text("Optimized")',
     statusBlocked: 'span:has-text("Blocked")',
  },

  // ===============
  // CELL HELPERS 
  // ===============
  cell: {
    //strict text match
    byText: (text) => `td:text-is("${text}")`,
  },
 // =============
  // PAGINATION
  // =============
  pagination:{
     rowsPerPageDropdown:'#page-size',
     nextBtn:'button[aria-label="Next page"]',
     prevBtn:'button[aria-label="Previous page"]',
     pageBtn: (page) => `button[aria-label="Go to page ${page}"]`,
     currentPage: '[aria-current="page"]',
  },

};
