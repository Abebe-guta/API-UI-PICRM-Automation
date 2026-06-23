# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI\screening-features\customer.screening.spec.js >> Customer Screening Journey >> Create segment → Screen customer → Validate results
- Location: tests\UI\screening-features\customer.screening.spec.js:15:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('button:has-text("Screening")')
Expected: "true"
Error: strict mode violation: locator('button:has-text("Screening")') resolved to 2 elements:
    1) <button class="w-full flex items-center rounded-r-md transition-colors font-medium min-h-[40px] lg:min-h-[44px] justify-between gap-2 pl-2 pr-2 lg:pl-3 lg:pr-3 py-2 lg:py-2.5 text-xs lg:text-sm text-sidebar-foreground/80 hover:bg-white/10 hover:text-white overflow-hidden">…</button> aka getByRole('button', { name: 'Screening', exact: true })
    2) <button class="w-full text-left pl-2 lg:pl-0 pr-2 lg:pr-3 py-1.5 lg:py-2 rounded-r-md transition-colors text-xs lg:text-sm min-h-[36px] lg:min-h-[40px] text-sidebar-foreground/70 hover:bg-white/5 hover:text-white">…</button> aka getByRole('button', { name: 'Customer Screening' })

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('button:has-text("Screening")')

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
      - generic [ref=e61]:
        - button "Screening" [active] [ref=e62] [cursor=pointer]:
          - generic [ref=e63]:
            - img [ref=e65]
            - generic [ref=e70]: Screening
          - img [ref=e71]
        - link "Customer Screening" [ref=e74] [cursor=pointer]:
          - /url: /picr/screening
          - button "Customer Screening" [ref=e75]:
            - generic [ref=e76]: Customer Screening
      - button "Settings" [ref=e78] [cursor=pointer]:
        - generic [ref=e79]:
          - img [ref=e81]
          - generic [ref=e84]: Settings
        - img [ref=e85]
    - generic [ref=e88]:
      - button "A" [ref=e90] [cursor=pointer]
      - generic [ref=e91]:
        - paragraph [ref=e92]: admin
        - paragraph [ref=e93]: super_admin
  - main [ref=e94]:
    - generic [ref=e95]:
      - generic [ref=e96]:
        - generic [ref=e97]:
          - heading "Portfolio Overview" [level=1] [ref=e98]
          - paragraph [ref=e99]: Unified Borrower Masterfile & Portfolio Metrics
        - button "Refresh" [ref=e101] [cursor=pointer]:
          - img
          - generic [ref=e102]: Refresh
      - generic [ref=e103]:
        - generic [ref=e104] [cursor=pointer]:
          - generic [ref=e105]:
            - heading "Total Loans" [level=3] [ref=e106]
            - img [ref=e107]
          - generic [ref=e112]:
            - generic [ref=e113]: 315,401
            - paragraph [ref=e114]: Total loans
        - generic [ref=e115] [cursor=pointer]:
          - generic [ref=e116]:
            - heading "Total Exposure" [level=3] [ref=e117]
            - img [ref=e118]
          - generic [ref=e120]:
            - generic [ref=e121]: ETB 8.63B
            - paragraph [ref=e122]: Total exposure
        - generic [ref=e123] [cursor=pointer]:
          - generic [ref=e124]:
            - heading "NPL Rate (90+ DPD)" [level=3] [ref=e125]
            - img [ref=e126]
          - generic [ref=e130]:
            - generic [ref=e131]: 53.81%
            - paragraph [ref=e132]: 169,628 borrowers
        - generic [ref=e133] [cursor=pointer]:
          - generic [ref=e134]:
            - heading "Borrowers" [level=3] [ref=e135]
            - img [ref=e136]
          - generic [ref=e138]:
            - generic [ref=e139]: 315,256
            - paragraph [ref=e140]: Total borrowers
      - generic [ref=e141]:
        - generic [ref=e142] [cursor=pointer]:
          - generic [ref=e143]:
            - generic [ref=e144]:
              - img [ref=e146]
              - heading "Exposure Engine" [level=3] [ref=e148]
            - generic [ref=e149]: Partial Coverage
          - generic [ref=e151]:
            - generic [ref=e152]:
              - generic [ref=e153]: "Coverage:"
              - generic [ref=e154]: 100.0% (315256 / 315256)
            - generic [ref=e155]:
              - generic [ref=e156]: "Last Run:"
              - generic [ref=e157]: 06/05/2026
            - generic [ref=e158]:
              - generic [ref=e159]: "Total:"
              - generic [ref=e160]: "315256"
            - generic [ref=e161]:
              - generic [ref=e162]: "High Risk (90+ DPD):"
              - generic [ref=e163]: "169628"
        - generic [ref=e164] [cursor=pointer]:
          - generic [ref=e166]:
            - img [ref=e168]
            - heading "High Priority Cases" [level=3] [ref=e170]
          - generic [ref=e171]:
            - generic [ref=e172]: 219,520
            - paragraph [ref=e173]: Requiring immediate action
        - generic [ref=e174] [cursor=pointer]:
          - generic [ref=e176]:
            - img [ref=e178]
            - heading "Active Cities" [level=3] [ref=e181]
          - generic [ref=e182]:
            - generic [ref=e183]: "50"
            - paragraph [ref=e184]: Tier 1 hotspots
      - generic [ref=e186]:
        - generic [ref=e188]:
          - generic [ref=e189]:
            - heading "NPL Distribution" [level=3] [ref=e190]
            - paragraph [ref=e191]: Top 10 Non-performing loans (DPD > 90) by category
          - combobox [ref=e192]:
            - option "By Gender" [selected]
            - option "By Product"
            - option "By Zone"
            - option "By Age"
            - option "By Region"
        - generic [ref=e194]:
          - generic [ref=e195]:
            - generic [ref=e196]:
              - generic [ref=e197]: FEMALE
              - generic [ref=e198]: 132,799 loans (78.3%)
            - generic [ref=e202]: ETB 2.57B
          - generic [ref=e203]:
            - generic [ref=e204]:
              - generic [ref=e205]: MALE
              - generic [ref=e206]: 36,826 loans (21.7%)
            - generic [ref=e210]: ETB 2.77B
          - generic [ref=e211]:
            - generic [ref=e212]:
              - generic [ref=e213]: Unknown
              - generic [ref=e214]: 3 loans (0.0%)
            - generic [ref=e217]: ETB 147,110.21
      - generic [ref=e218]:
        - generic [ref=e219]:
          - generic [ref=e220]:
            - heading "Top Cities by Borrowers" [level=3] [ref=e221]
            - paragraph [ref=e222]: Top 10 cities
          - generic [ref=e225]:
            - button "Fullscreen" [ref=e226] [cursor=pointer]:
              - img [ref=e227]
            - button "Chart Actions" [ref=e233] [cursor=pointer]:
              - img [ref=e234]
        - generic [ref=e238]:
          - generic [ref=e239]:
            - heading "DPD Distribution" [level=3] [ref=e240]
            - paragraph [ref=e241]: Loans by Days Past Due
          - generic [ref=e244]:
            - button "Fullscreen" [ref=e245] [cursor=pointer]:
              - img [ref=e246]
            - button "Chart Actions" [ref=e252] [cursor=pointer]:
              - img [ref=e253]
      - generic [ref=e257]:
        - generic [ref=e258]:
          - heading "Priority Distribution" [level=3] [ref=e259]
          - paragraph [ref=e260]: Borrowers by collection priority
        - generic [ref=e262]:
          - generic [ref=e263]:
            - generic [ref=e264]: 219,520
            - generic [ref=e265]: High Priority
          - generic [ref=e266]:
            - generic [ref=e267]: 30,181
            - generic [ref=e268]: Medium Priority
          - generic [ref=e269]:
            - generic [ref=e270]: 65,555
            - generic [ref=e271]: Low Priority
      - generic [ref=e272]:
        - generic [ref=e274]:
          - generic [ref=e275]:
            - heading "High-Risk Borrowers" [level=3] [ref=e276]
            - paragraph [ref=e277]: Recent flagged cases requiring attention (219,520 total)
          - button "Export" [ref=e279] [cursor=pointer]:
            - img
            - text: Export
          - generic [ref=e280]:
            - generic [ref=e281]:
              - img [ref=e282]
              - generic [ref=e285]: "251"
              - textbox "Search by phone (numbers only)..." [ref=e287]
            - generic [ref=e288]:
              - combobox [ref=e289]:
                - option "All Tiers" [selected]
                - option "Tier 1"
                - option "Tier 2"
                - option "Tier 3"
              - generic [ref=e290]:
                - generic [ref=e291]: Page
                - spinbutton [ref=e293]: "1"
              - generic [ref=e294]:
                - generic [ref=e295]: Rows
                - spinbutton [ref=e297]: "5"
        - generic [ref=e298]:
          - table [ref=e301]:
            - rowgroup [ref=e302]:
              - row "Borrower ID Name MSISDN City Priority Exposure DPD Risk Flags" [ref=e303]:
                - columnheader "Borrower ID" [ref=e304]:
                  - generic [ref=e307]: Borrower ID
                - columnheader "Name" [ref=e308]:
                  - generic [ref=e311]: Name
                - columnheader "MSISDN" [ref=e312]:
                  - generic [ref=e315]: MSISDN
                - columnheader "City" [ref=e316]:
                  - generic [ref=e319]: City
                - columnheader "Priority" [ref=e320]:
                  - generic [ref=e323]: Priority
                - columnheader "Exposure" [ref=e324]:
                  - generic [ref=e327]: Exposure
                - columnheader "DPD" [ref=e328]:
                  - generic [ref=e331]: DPD
                - columnheader "Risk Flags" [ref=e332]:
                  - generic [ref=e335]: Risk Flags
            - rowgroup [ref=e336]:
              - row "251909294950 Borrower 251909294950 251909294950 Adama Tier 2 HIGH ETB 756,764.27 150 (91-180) High Exposure High DPD" [ref=e337] [cursor=pointer]:
                - cell "251909294950" [ref=e338]
                - cell "Borrower 251909294950" [ref=e339]
                - cell "251909294950" [ref=e340]
                - cell "Adama Tier 2" [ref=e341]:
                  - generic [ref=e342]:
                    - generic [ref=e343]: Adama
                    - generic [ref=e344]: Tier 2
                - cell "HIGH" [ref=e345]:
                  - generic [ref=e346]: HIGH
                - cell "ETB 756,764.27" [ref=e347]
                - cell "150 (91-180)" [ref=e348]:
                  - generic [ref=e349]: 150 (91-180)
                - cell "High Exposure High DPD" [ref=e350]:
                  - generic [ref=e351]:
                    - generic [ref=e352]: High Exposure
                    - generic [ref=e353]: High DPD
              - row "251912011617 Borrower 251912011617 251912011617 Addis Ababa (City) Tier 2 HIGH ETB 716,701.37 235 (181-360) High Exposure High DPD" [ref=e354] [cursor=pointer]:
                - cell "251912011617" [ref=e355]
                - cell "Borrower 251912011617" [ref=e356]
                - cell "251912011617" [ref=e357]
                - cell "Addis Ababa (City) Tier 2" [ref=e358]:
                  - generic [ref=e359]:
                    - generic [ref=e360]: Addis Ababa (City)
                    - generic [ref=e361]: Tier 2
                - cell "HIGH" [ref=e362]:
                  - generic [ref=e363]: HIGH
                - cell "ETB 716,701.37" [ref=e364]
                - cell "235 (181-360)" [ref=e365]:
                  - generic [ref=e366]: 235 (181-360)
                - cell "High Exposure High DPD" [ref=e367]:
                  - generic [ref=e368]:
                    - generic [ref=e369]: High Exposure
                    - generic [ref=e370]: High DPD
              - row "251915764991 Borrower 251915764991 251915764991 Dire Dawa Tier 2 HIGH ETB 691,656.81 83 (61-90) High Exposure High DPD" [ref=e371] [cursor=pointer]:
                - cell "251915764991" [ref=e372]
                - cell "Borrower 251915764991" [ref=e373]
                - cell "251915764991" [ref=e374]
                - cell "Dire Dawa Tier 2" [ref=e375]:
                  - generic [ref=e376]:
                    - generic [ref=e377]: Dire Dawa
                    - generic [ref=e378]: Tier 2
                - cell "HIGH" [ref=e379]:
                  - generic [ref=e380]: HIGH
                - cell "ETB 691,656.81" [ref=e381]
                - cell "83 (61-90)" [ref=e382]:
                  - generic [ref=e383]: 83 (61-90)
                - cell "High Exposure High DPD" [ref=e384]:
                  - generic [ref=e385]:
                    - generic [ref=e386]: High Exposure
                    - generic [ref=e387]: High DPD
              - row "251930466646 Borrower 251930466646 251930466646 Addis Ababa (City) Tier 2 HIGH ETB 689,712.48 132 (91-180) High Exposure High DPD" [ref=e388] [cursor=pointer]:
                - cell "251930466646" [ref=e389]
                - cell "Borrower 251930466646" [ref=e390]
                - cell "251930466646" [ref=e391]
                - cell "Addis Ababa (City) Tier 2" [ref=e392]:
                  - generic [ref=e393]:
                    - generic [ref=e394]: Addis Ababa (City)
                    - generic [ref=e395]: Tier 2
                - cell "HIGH" [ref=e396]:
                  - generic [ref=e397]: HIGH
                - cell "ETB 689,712.48" [ref=e398]
                - cell "132 (91-180)" [ref=e399]:
                  - generic [ref=e400]: 132 (91-180)
                - cell "High Exposure High DPD" [ref=e401]:
                  - generic [ref=e402]:
                    - generic [ref=e403]: High Exposure
                    - generic [ref=e404]: High DPD
              - row "251913176394 Borrower 251913176394 251913176394 Addis Ababa (City) Tier 2 HIGH ETB 672,061.9 0 (0-30) High Exposure" [ref=e405] [cursor=pointer]:
                - cell "251913176394" [ref=e406]
                - cell "Borrower 251913176394" [ref=e407]
                - cell "251913176394" [ref=e408]
                - cell "Addis Ababa (City) Tier 2" [ref=e409]:
                  - generic [ref=e410]:
                    - generic [ref=e411]: Addis Ababa (City)
                    - generic [ref=e412]: Tier 2
                - cell "HIGH" [ref=e413]:
                  - generic [ref=e414]: HIGH
                - cell "ETB 672,061.9" [ref=e415]
                - cell "0 (0-30)" [ref=e416]:
                  - generic [ref=e417]: 0 (0-30)
                - cell "High Exposure" [ref=e418]:
                  - generic [ref=e420]: High Exposure
          - generic [ref=e421]:
            - generic [ref=e422]: Showing 1 to 5 of 219,520 borrowers
            - generic [ref=e423]:
              - button "Previous" [disabled]
              - button "Next" [ref=e424] [cursor=pointer]
      - generic [ref=e425]:
        - generic [ref=e427]:
          - generic [ref=e428]:
            - heading "Active Alerts" [level=3] [ref=e429]
            - paragraph [ref=e430]: Automated exposure risk flags (67180 total)
          - generic [ref=e431]:
            - generic [ref=e432]:
              - generic [ref=e433]: Page
              - spinbutton [ref=e435]: "1"
            - generic [ref=e436]:
              - generic [ref=e437]: Rows
              - spinbutton [ref=e439]: "5"
        - generic [ref=e440]:
          - generic [ref=e441]:
            - generic [ref=e442]:
              - img [ref=e444]
              - generic [ref=e446]:
                - generic [ref=e447]:
                  - 'heading "High Exposure: Borrower 251909294950" [level=3] [ref=e448]'
                  - generic [ref=e449]: critical
                  - generic [ref=e450]: City Surge
                - paragraph [ref=e451]: Total exposure 756764 ETB across 1 banks with DPD 150.
                - generic [ref=e452]:
                  - generic [ref=e453]: Borrower 251909294950
                  - generic [ref=e454]: •
                  - generic [ref=e455]: 06/05/2026
              - generic [ref=e456]:
                - button [ref=e457] [cursor=pointer]:
                  - img
                - button [ref=e458] [cursor=pointer]:
                  - img
            - generic [ref=e459]:
              - img [ref=e461]
              - generic [ref=e463]:
                - generic [ref=e464]:
                  - 'heading "High Exposure: Borrower 251912011617" [level=3] [ref=e465]'
                  - generic [ref=e466]: critical
                  - generic [ref=e467]: City Surge
                - paragraph [ref=e468]: Total exposure 716701 ETB across 1 banks with DPD 235.
                - generic [ref=e469]:
                  - generic [ref=e470]: Borrower 251912011617
                  - generic [ref=e471]: •
                  - generic [ref=e472]: 06/05/2026
              - generic [ref=e473]:
                - button [ref=e474] [cursor=pointer]:
                  - img
                - button [ref=e475] [cursor=pointer]:
                  - img
            - generic [ref=e476]:
              - img [ref=e478]
              - generic [ref=e480]:
                - generic [ref=e481]:
                  - 'heading "High Exposure: Borrower 251915764991" [level=3] [ref=e482]'
                  - generic [ref=e483]: critical
                  - generic [ref=e484]: City Surge
                - paragraph [ref=e485]: Total exposure 691657 ETB across 1 banks with DPD 83.
                - generic [ref=e486]:
                  - generic [ref=e487]: Borrower 251915764991
                  - generic [ref=e488]: •
                  - generic [ref=e489]: 06/05/2026
              - generic [ref=e490]:
                - button [ref=e491] [cursor=pointer]:
                  - img
                - button [ref=e492] [cursor=pointer]:
                  - img
            - generic [ref=e493]:
              - img [ref=e495]
              - generic [ref=e497]:
                - generic [ref=e498]:
                  - 'heading "High Exposure: Borrower 251930466646" [level=3] [ref=e499]'
                  - generic [ref=e500]: critical
                  - generic [ref=e501]: City Surge
                - paragraph [ref=e502]: Total exposure 689712 ETB across 1 banks with DPD 132.
                - generic [ref=e503]:
                  - generic [ref=e504]: Borrower 251930466646
                  - generic [ref=e505]: •
                  - generic [ref=e506]: 06/05/2026
              - generic [ref=e507]:
                - button [ref=e508] [cursor=pointer]:
                  - img
                - button [ref=e509] [cursor=pointer]:
                  - img
            - generic [ref=e510]:
              - img [ref=e512]
              - generic [ref=e514]:
                - generic [ref=e515]:
                  - 'heading "High Exposure: Borrower 251925259569" [level=3] [ref=e516]'
                  - generic [ref=e517]: critical
                  - generic [ref=e518]: City Surge
                - paragraph [ref=e519]: Total exposure 455904 ETB across 1 banks with DPD 730.
                - generic [ref=e520]:
                  - generic [ref=e521]: Borrower 251925259569
                  - generic [ref=e522]: •
                  - generic [ref=e523]: 06/05/2026
              - generic [ref=e524]:
                - button [ref=e525] [cursor=pointer]:
                  - img
                - button [ref=e526] [cursor=pointer]:
                  - img
          - generic [ref=e527]:
            - generic [ref=e528]: Showing 1 to 5 of 67180 alerts
            - generic [ref=e529]:
              - button "Previous" [disabled]
              - button "Next" [ref=e530] [cursor=pointer]
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
> 29  |       await expect(parentButton).toHaveAttribute("aria-expanded", "true");
      |                                  ^ Error: expect(locator).toHaveAttribute(expected) failed
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
  61  |     await this.fillAndTab(this.locators.inputs.segmentId, segmentId);
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
```