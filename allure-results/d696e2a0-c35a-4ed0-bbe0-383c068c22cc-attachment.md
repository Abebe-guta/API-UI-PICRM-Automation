# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI\screening-features\customer.screening.spec.js >> Customer Screening Journey >> Create segment → Screen customer → Validate results
- Location: tests\UI\screening-features\customer.screening.spec.js:15:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "not-in-segment"
Received: "results"
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
        - button "Check Customer" [ref=e111] [cursor=pointer]:
          - img
          - text: Check Customer
      - generic [ref=e112]:
        - generic [ref=e113]:
          - img [ref=e114]
          - generic [ref=e116]: Error
        - paragraph [ref=e117]: Segment not found
```

# Test source

```ts
  19  |   }) => {
  20  |     // =========================
  21  |     // 1. API - create segment
  22  |     // =========================
  23  |     const payload = await builder.build();
  24  |     payload.config.name = buildSegmentName(payload.config.table_name);
  25  | 
  26  |     const segmentResponse = await segmentAPI.createSegment(payload.config);
  27  |     expect(segmentResponse.id).toBeTruthy();
  28  | 
  29  |     const segmentId = segmentResponse.id;
  30  |     const segmentNameFromResp = segmentResponse.name;
  31  | 
  32  |     // =========================
  33  |     // 2. DB validation
  34  |     // =========================
  35  |     const segmentFromDB = await getSegmentById(segmentId);
  36  |     expect(segmentFromDB.id).toBe(segmentId);
  37  | 
  38  |     console.log(`✅ Segment created — id: ${segmentId}`);
  39  | 
  40  |     // =========================
  41  |     // 3. UI setup
  42  |     // =========================
  43  |     const screeningPage = new ScreeningPage(sharedPage);
  44  |     await screeningPage.goto();
  45  | 
  46  |     expect(await screeningPage.getPageTitle()).toBe("Customer Screening");
  47  | 
  48  |     // =========================
  49  |     // 4. Validation (no segment)
  50  |     // =========================
  51  |     await screeningPage.resetFormState();
  52  |     await screeningPage.fillCustomerId(CUSTOMER_ID);
  53  |     await screeningPage.submitSearch();
  54  | 
  55  |     const validationMsg = await screeningPage.getSegmentValidationMessage();
  56  | 
  57  |     console.log("✅ Validation message:", validationMsg);
  58  | 
  59  |     expect(validationMsg).toBe(
  60  |       "Please enter either Segment ID or Segment Name",
  61  |     );
  62  |     // =========================
  63  |     // CLEAN START
  64  |     // =========================
  65  |     await sharedPage.reload({
  66  |       waitUntil: "networkidle",
  67  |     });
  68  | 
  69  |     await screeningPage.waitForPageLoaded();
  70  | 
  71  |     // =========================
  72  |     // 5. Search by ID
  73  |     // =========================
  74  |     const resultById = await screeningPage.searchBySegmentId(
  75  |       CUSTOMER_ID,
  76  |       segmentId,
  77  |     );
  78  | 
  79  |     // FIX: only real states
  80  |     expect(["results", "not-in-segment"]).toContain(resultById.state);
  81  | 
  82  |     // FIX: match real API response format
  83  |     if (resultById.data) {
  84  |       expect(resultById.data.segment_id).toBe(segmentId);
  85  |       expect(resultById.data.segment_name).toBe(segmentNameFromResp);
  86  |       expect(typeof resultById.data.in_segment).toBe("boolean");
  87  | 
  88  |       if (resultById.state === "results") {
  89  |         expect(resultById.data.risk_score).not.toBeNull();
  90  |         expect(resultById.data.risk_tier).not.toBeNull();
  91  |       }
  92  |     }
  93  | 
  94  |     console.log(`✅ Search by ID — ${resultById.state}`);
  95  | 
  96  |     // =========================
  97  |     // 6. Search by name
  98  |     // =========================
  99  |     const resultByName = await screeningPage.searchBySegmentName(
  100 |       CUSTOMER_ID,
  101 |       segmentNameFromResp,
  102 |     );
  103 | 
  104 |     expect(["results", "not-in-segment"]).toContain(resultByName.state);
  105 | 
  106 |     expect(resultByName.data.segment_name).toBe(segmentNameFromResp);
  107 | 
  108 |     console.log(`✅ Search by name — ${resultByName.state}`);
  109 | 
  110 |     // =========================
  111 |     // 7. Invalid segment
  112 |     // =========================
  113 |     const errorResult = await screeningPage.searchBySegmentId(
  114 |       CUSTOMER_ID,
  115 |       "999999999",
  116 |     );
  117 | 
  118 |     // depends on backend behavior
> 119 |     expect(errorResult.state).toBe("not-in-segment");
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  120 |     expect(errorResult.message).toBe("Segment not found");
  121 | 
  122 |     console.log("✅ Customer screening journey completed");
  123 |   });
  124 | });
  125 | 
```