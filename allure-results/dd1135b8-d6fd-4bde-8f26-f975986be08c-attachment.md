# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI\screening-features\customer.screening.spec.js >> Customer Screening Journey >> Create segment → Screen customer → Validate results
- Location: tests\UI\screening-features\customer.screening.spec.js:15:3

# Error details

```
TypeError: this.fillAndTab is not a function
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - img "Kifiya Logo" [ref=e8]
        - paragraph [ref=e9]: Credit Risk Intelligence
      - button "Close sidebar" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
    - navigation [ref=e14]:
      - button "Dashboard" [ref=e16] [cursor=pointer]:
        - generic [ref=e17]:
          - img [ref=e18]
          - generic [ref=e23]: Dashboard
        - img [ref=e24]
      - button "Data Provider" [ref=e27] [cursor=pointer]:
        - generic [ref=e28]:
          - img [ref=e30]
          - generic [ref=e34]: Data Provider
        - img [ref=e35]
      - button "Segment Manager" [ref=e38] [cursor=pointer]:
        - generic [ref=e39]:
          - img [ref=e41]
          - generic [ref=e43]: Segment Manager
        - img [ref=e44]
      - button "Agentic Credit Risk" [ref=e47] [cursor=pointer]:
        - generic [ref=e48]:
          - img [ref=e50]
          - generic [ref=e58]: Agentic Credit Risk
        - img [ref=e59]
      - button "Screening" [ref=e62] [cursor=pointer]:
        - generic [ref=e63]:
          - img [ref=e65]
          - generic [ref=e70]: Screening
        - img [ref=e71]
      - button "Settings" [ref=e74] [cursor=pointer]:
        - generic [ref=e75]:
          - img [ref=e77]
          - generic [ref=e80]: Settings
        - img [ref=e81]
    - generic [ref=e84]:
      - button "A" [ref=e86] [cursor=pointer]
      - generic [ref=e87]:
        - paragraph [ref=e88]: admin
        - paragraph [ref=e89]: super_admin
  - main [ref=e90]:
    - generic [ref=e91]:
      - generic [ref=e92]:
        - heading "Customer Screening" [level=1] [ref=e93]
        - paragraph [ref=e94]: Check if a customer is in a segment and view their risk score and segment status
      - generic [ref=e96]:
        - generic [ref=e97]:
          - generic [ref=e98]: Customer ID *
          - textbox "Customer ID *" [active] [ref=e100]:
            - /placeholder: Enter Customer ID
            - text: 68372393f1cd711a709c7a7c
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e103]: Segment ID
            - spinbutton "Segment ID" [ref=e105]
          - generic [ref=e106]:
            - generic [ref=e107]: Segment Name
            - textbox "Segment Name" [ref=e109]:
              - /placeholder: Enter Segment Name
        - button "Check Customer" [ref=e111] [cursor=pointer]:
          - img
          - text: Check Customer
```

# Test source

```ts
  1   | import { expect } from "@playwright/test";
  2   | import { ScreeningLocators } from "../../locators/screening/ScreeningLocators.js";
  3   | import { BasePage } from "../../base/BasePage.js";
  4   | 
  5   | class ScreeningPage extends BasePage {
  6   |   constructor(page) {
  7   |     super(page);
  8   |     this.page = page;
  9   | 
  10  |     this.locators = ScreeningLocators;
  11  |     this.url = "/picr/screening";
  12  |     this.searchTriggered = false;
  13  |   }
  14  | 
  15  |   // =====================================================
  16  |   // NAVIGATION
  17  |   // =====================================================
  18  | 
  19  |   async goto() {
  20  |     const parentButton = this.page.locator('button:has-text("Screening")');
  21  | 
  22  |     await parentButton.waitFor({ state: "visible", timeout: 30000 });
  23  | 
  24  |     const isExpanded =
  25  |       (await parentButton.getAttribute("aria-expanded")) === "true";
  26  | 
  27  |     if (!isExpanded) {
  28  |       await parentButton.click();
  29  |       console.log("✅ Expanded sub‑menu");
  30  |     }
  31  | 
  32  |     const screeningLink = this.page.locator('a[href="/picr/screening"]');
  33  | 
  34  |     await Promise.all([
  35  |       this.page.waitForURL("**/screening", { timeout: 60000 }),
  36  |       screeningLink.click(),
  37  |     ]);
  38  | 
  39  |     await this.waitForPageLoaded();
  40  |   }
  41  | 
  42  |   async waitForPageLoaded() {
  43  |     await this.page
  44  |       .locator(this.locators.headers.title)
  45  |       .waitFor({ state: "visible", timeout: 60000 });
  46  |   }
  47  | 
  48  |   async getPageTitle() {
  49  |     return await this.getText(this.locators.headers.title);
  50  |   }
  51  | 
  52  |   // =====================================================
  53  |   // FORM ACTIONS (CLEANED)
  54  |   // =====================================================
  55  | 
  56  |   async fillCustomerId(customerId) {
  57  |     await this.fill(this.locators.inputs.customerId, customerId);
  58  |   }
  59  | 
  60  |   async fillSegmentId(segmentId) {
> 61  |     await this.fillAndTab(this.locators.inputs.segmentId, segmentId);
      |                ^ TypeError: this.fillAndTab is not a function
  62  |   }
  63  | 
  64  |   async fillSegmentName(segmentName) {
  65  |     await this.fillAndTab(this.locators.inputs.segmentName, segmentName);
  66  |   }
  67  | 
  68  |   async submitSearch() {
  69  |     this.searchTriggered = true;
  70  |     await this.click(this.locators.actions.searchBtn);
  71  |   }
  72  | 
  73  |   // =====================================================
  74  |   // RESET (OPTIMIZED)
  75  |   // =====================================================
  76  | 
  77  |   async resetFormState() {
  78  |     if (!this.page || this.page.isClosed?.()) return;
  79  | 
  80  |     await Promise.all([
  81  |       this.fill(this.locators.inputs.customerId, ""),
  82  |       this.fill(this.locators.inputs.segmentId, ""),
  83  |       this.fill(this.locators.inputs.segmentName, ""),
  84  |     ]);
  85  | 
  86  |     this.searchTriggered = false;
  87  |   }
  88  | 
  89  |   // =====================================================
  90  |   // HIGH LEVEL FLOWS (FIXED - NO DOUBLE CLICK BUG)
  91  |   // =====================================================
  92  | 
  93  |   async searchBySegmentId(customerId, segmentId, timeout = 60000) {
  94  |     await this.resetFormState();
  95  | 
  96  |     const responsePromise = this.waitForScreeningResponse(timeout);
  97  | 
  98  |     await this.fillCustomerId(customerId);
  99  |     await this.fillSegmentId(segmentId);
  100 |     await this.submitSearch();
  101 | 
  102 |     const response = await responsePromise;
  103 |     return this.normalizeResponse(response);
  104 |   }
  105 | 
  106 |   async searchBySegmentName(customerId, segmentName, timeout = 60000) {
  107 |     await this.resetFormState();
  108 | 
  109 |     const responsePromise = this.waitForScreeningResponse(timeout);
  110 | 
  111 |     await this.fillCustomerId(customerId);
  112 |     await this.fillSegmentName(segmentName);
  113 |     await this.submitSearch();
  114 | 
  115 |     const response = await responsePromise;
  116 |     return this.normalizeResponse(response);
  117 |   }
  118 | 
  119 |   // =====================================================
  120 |   // API INTERCEPTION (CLEAN + SAFE)
  121 |   // =====================================================
  122 | 
  123 |   async waitForScreeningResponse(timeout = 60000) {
  124 |     return await this.page.waitForResponse(
  125 |       (res) =>
  126 |         res.url().includes("/screening") && res.request().method() === "POST",
  127 |       { timeout },
  128 |     );
  129 |   }
  130 | 
  131 |   // =====================================================
  132 |   // RESPONSE NORMALIZATION
  133 |   // =====================================================
  134 | 
  135 |   async normalizeResponse(response) {
  136 |     let json;
  137 | 
  138 |     try {
  139 |       json = await response.json();
  140 |     } catch {
  141 |       throw new Error("[ScreeningPage] Failed to parse API response JSON");
  142 |     }
  143 | 
  144 |     console.log("🔎 SCREENING API RESPONSE:", JSON.stringify(json, null, 2));
  145 | 
  146 |     if (json.detail) {
  147 |       return { state: "error", message: json.detail, data: json };
  148 |     }
  149 | 
  150 |     if (json.error) {
  151 |       return { state: "error", message: json.error, data: json };
  152 |     }
  153 | 
  154 |     if (json.success === false) {
  155 |       return { state: "validation", message: json.message, data: json };
  156 |     }
  157 | 
  158 |     if (typeof json.in_segment === "boolean") {
  159 |       return {
  160 |         state: json.in_segment ? "results" : "not-in-segment",
  161 |         data: json,
```