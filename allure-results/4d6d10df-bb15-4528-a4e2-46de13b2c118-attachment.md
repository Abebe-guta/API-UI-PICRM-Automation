# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI\screening-features\customer.screening.spec.js >> Customer Screening Journey >> Create segment → Screen customer → Validate results
- Location: tests\UI\screening-features\customer.screening.spec.js:15:3

# Error details

```
Error: Unexpected state "results"

expect(received).toContain(expected) // indexOf

Expected value: "results"
Received array: ["not-in-segment", "error"]
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
          - textbox "Customer ID *" [ref=e100]:
            - /placeholder: Enter Customer ID
            - text: 68372393f1cd711a709c7a7c
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e103]: Segment ID
            - spinbutton "Segment ID" [ref=e105]: "999999999"
          - generic [ref=e106]:
            - generic [ref=e107]: Segment Name
            - textbox "Segment Name" [ref=e109]:
              - /placeholder: Enter Segment Name
        - generic [ref=e110]:
          - button "Checking..." [disabled]:
            - img
            - text: Checking...
```

# Test source

```ts
  64  |     const validationMsg = await screeningPage.getSegmentValidationMessage();
  65  |     console.log("✅ Validation message:", validationMsg);
  66  | 
  67  |     expect(
  68  |       validationMsg,
  69  |       "Must warn when no segment ID or name is provided",
  70  |     ).toBe("Please enter either Segment ID or Segment Name");
  71  | 
  72  |     // =========================
  73  |     // CLEAN START
  74  |     // Reload so the validation state and any stale DOM are fully
  75  |     // cleared before the search steps begin
  76  |     // =========================
  77  |     await sharedPage.reload({ waitUntil: "networkidle" });
  78  |     await screeningPage.waitForPageLoaded();
  79  | 
  80  |     // =========================
  81  |     // 5. Search by segment ID
  82  |     // =========================
  83  |     const resultById = await screeningPage.searchBySegmentId(
  84  |       CUSTOMER_ID,
  85  |       segmentId,
  86  |     );
  87  | 
  88  |     expect(
  89  |       ["results", "not-in-segment"],
  90  |       `Unexpected state "${resultById.state}"`,
  91  |     ).toContain(resultById.state);
  92  | 
  93  |     if (resultById.data) {
  94  |       // FIX: normalize both sides to Number — API may return id as string or number
  95  |       expect(
  96  |         Number(resultById.data.segment_id),
  97  |         "Segment ID must match created segment",
  98  |       ).toBe(Number(segmentId));
  99  | 
  100 |       expect(
  101 |         resultById.data.segment_name,
  102 |         "Segment name must match created segment",
  103 |       ).toBe(segmentNameFromResp);
  104 | 
  105 |       expect(
  106 |         typeof resultById.data.in_segment,
  107 |         "in_segment must be a boolean",
  108 |       ).toBe("boolean");
  109 | 
  110 |       // In-segment-only fields — only present when customer matched
  111 |       if (resultById.state === "results") {
  112 |         expect(
  113 |           resultById.data.risk_score,
  114 |           "Risk score must be present when in segment",
  115 |         ).not.toBeNull();
  116 |         expect(
  117 |           resultById.data.risk_tier,
  118 |           "Risk tier must be present when in segment",
  119 |         ).not.toBeNull();
  120 |       }
  121 |     }
  122 | 
  123 |     console.log(`✅ Search by ID — state: ${resultById.state}`);
  124 | 
  125 |     // =========================
  126 |     // 6. Search by segment name
  127 |     // Must return same segment as step 5
  128 |     // =========================
  129 |     const resultByName = await screeningPage.searchBySegmentName(
  130 |       CUSTOMER_ID,
  131 |       segmentNameFromResp,
  132 |     );
  133 | 
  134 |     expect(
  135 |       ["results", "not-in-segment"],
  136 |       `Unexpected state "${resultByName.state}"`,
  137 |     ).toContain(resultByName.state);
  138 | 
  139 |     expect(
  140 |       resultByName.data.segment_name,
  141 |       "Segment name must be consistent between ID and name search",
  142 |     ).toBe(segmentNameFromResp);
  143 | 
  144 |     // Both searches hit the same segment — states must match
  145 |     expect(
  146 |       resultByName.state,
  147 |       "Name search must return same state as ID search",
  148 |     ).toBe(resultById.state);
  149 | 
  150 |     console.log(`✅ Search by name — state: ${resultByName.state}`);
  151 | 
  152 |     // =========================
  153 |     // 7. Invalid segment ID
  154 |     // =========================
  155 | 
  156 |     const errorResult = await screeningPage.searchBySegmentId(
  157 |       CUSTOMER_ID,
  158 |       "999999999",
  159 |     );
  160 | 
  161 |     expect(
  162 |       ["not-in-segment", "error"],
  163 |       `Unexpected state "${errorResult.state}"`,
> 164 |     ).toContain(errorResult.state);
      |       ^ Error: Unexpected state "results"
  165 | 
  166 |     // If backend ever starts returning a proper error, this will catch it
  167 |     if (errorResult.state === "error") {
  168 |       expect(errorResult.message, "Error message must be present").toBeTruthy();
  169 |     }
  170 | 
  171 |     // Current backend behavior: non-existent segment returns not-in-segment
  172 |     if (errorResult.state === "not-in-segment") {
  173 |       expect(
  174 |         errorResult.data.in_segment,
  175 |         "in_segment must be false for non-existent segment",
  176 |       ).toBe(false);
  177 |     }
  178 | 
  179 |     console.log(`✅ Invalid segment — state: ${errorResult.state}`);
  180 |     console.log("✅ Customer screening journey completed");
  181 |   });
  182 | });
  183 | 
```