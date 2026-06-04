import { test, expect } from "../../../fixtures/base.fixture.js";
import { buildSegmentName } from "../../../utils/testData.js";
import { getSegmentById } from "../../../db/segment.db.js";
import { ScreeningPage } from "../../../pages/UI/screening/ScreeningPage.js";

const CUSTOMER_ID = process.env.SCREENING_CUSTOMER_ID;

if (!CUSTOMER_ID) {
  throw new Error("[screening.spec] SCREENING_CUSTOMER_ID is missing");
}

test.describe.configure({ mode: "serial", timeout: 120_000 });

test.describe("Customer Screening Journey", () => {
  test("Create segment → Screen customer → Validate results", async ({
    sharedPage,
    builder,
    segmentAPI,
  }) => {
    // =========================
    // 1. API - create segment
    // =========================
    const payload = await builder.build();
    payload.config.name = buildSegmentName(payload.config.table_name);

    const segmentResponse = await segmentAPI.createSegment(payload.config);
    expect(segmentResponse.id).toBeTruthy();

    const segmentId = segmentResponse.id;
    const segmentNameFromResp = segmentResponse.name;

    // =========================
    // 2. DB validation
    // =========================
    const segmentFromDB = await getSegmentById(segmentId);
    expect(segmentFromDB.id).toBe(segmentId);

    console.log(`✅ Segment created — id: ${segmentId}`);

    // =========================
    // 3. UI setup
    // =========================
    const screeningPage = new ScreeningPage(sharedPage);
    await screeningPage.goto();

    expect(await screeningPage.getPageTitle()).toBe("Customer Screening");

    // =========================
    // 4. Validation (no segment)
    // =========================
    await screeningPage.resetFormState();
    await screeningPage.fillCustomerId(CUSTOMER_ID);
    await screeningPage.submitSearch();

    const validationMsg = await screeningPage.getSegmentValidationMessage();

    console.log("✅ Validation message:", validationMsg);

    expect(validationMsg).toBe(
      "Please enter either Segment ID or Segment Name",
    );
    // =========================
    // CLEAN START
    // =========================
    await sharedPage.reload({
      waitUntil: "networkidle",
    });

    await screeningPage.waitForPageLoaded();

    // =========================
    // 5. Search by ID
    // =========================
    const resultById = await screeningPage.searchBySegmentId(
      CUSTOMER_ID,
      segmentId,
    );

    // FIX: only real states
    expect(["results", "not-in-segment"]).toContain(resultById.state);

    // FIX: match real API response format
    if (resultById.data) {
      expect(resultById.data.segment_id).toBe(segmentId);
      expect(resultById.data.segment_name).toBe(segmentNameFromResp);
      expect(typeof resultById.data.in_segment).toBe("boolean");

      if (resultById.state === "results") {
        expect(resultById.data.risk_score).not.toBeNull();
        expect(resultById.data.risk_tier).not.toBeNull();
      }
    }

    console.log(`✅ Search by ID — ${resultById.state}`);

    // =========================
    // 6. Search by name
    // =========================
    const resultByName = await screeningPage.searchBySegmentName(
      CUSTOMER_ID,
      segmentNameFromResp,
    );

    expect(["results", "not-in-segment"]).toContain(resultByName.state);

    expect(resultByName.data.segment_name).toBe(segmentNameFromResp);

    console.log(`✅ Search by name — ${resultByName.state}`);

    // =========================
    // 7. Invalid segment
    // =========================
    const errorResult = await screeningPage.searchBySegmentId(
      CUSTOMER_ID,
      "999999999",
    );

    // depends on backend behavior
    expect(errorResult.state).toBe("error");
    expect(errorResult.message).toBe("Segment not found");

    console.log("✅ Customer screening journey completed");
  });
});
