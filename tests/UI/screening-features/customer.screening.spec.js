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
    //builder,
    //segmentAPI,
    createdSegment,
  }) => {
    /*
    // =========================
    // 1. API — create segment
    // =========================
    const payload = await builder.build();
    payload.config.name = buildSegmentName(payload.config.table_name);

    const segmentResponse = await segmentAPI.createSegment(payload.config);
    expect(
      segmentResponse.id,
      "Segment creation must return an id",
    ).toBeTruthy();

    const segmentId = segmentResponse.id; // number
    const segmentNameFromResp = segmentResponse.name;

    // =========================
    // 2. DB validation
    // =========================
    const segmentFromDB = await getSegmentById(segmentId);
    expect(segmentFromDB.id, "DB segment id must match API").toBe(segmentId);
*/
    const { id: segmentId, name: segmentNameFromResp } = createdSegment;
    console.log(
      `✅ Using segment — id: ${segmentId}, name: ${segmentNameFromResp}`,
    );

    // =========================
    // 1. UI setup
    // =========================
    const screeningPage = new ScreeningPage(sharedPage);
    await screeningPage.goto();

    expect(
      await screeningPage.getPageTitle(),
      'Page title must be "Customer Screening"',
    ).toBe("Customer Screening");

    // =========================
    // 2. Validation (no segment)
    // =========================
    await screeningPage.resetFormState();
    await screeningPage.fillCustomerId(CUSTOMER_ID);
    await screeningPage.submitSearch();

    const validationMsg = await screeningPage.getSegmentValidationMessage();
    console.log("✅ Validation message:", validationMsg);

    expect(
      validationMsg,
      "Must warn when no segment ID or name is provided",
    ).toBe("Please enter either Segment ID or Segment Name");

    // =========================
    // CLEAN START
    // =========================
    await sharedPage.reload({ waitUntil: "networkidle" });
    await screeningPage.waitForPageLoaded();

    // =========================
    // 3. Search by segment ID
    // =========================
    const resultById = await screeningPage.searchBySegmentId(
      CUSTOMER_ID,
      segmentId,
    );

    expect(
      ["results", "not-in-segment"],
      `Unexpected state "${resultById.state}"`,
    ).toContain(resultById.state);

    if (resultById.data) {
      expect(
        Number(resultById.data.segment_id),
        "Segment ID must match created segment",
      ).toBe(Number(segmentId));

      expect(
        resultById.data.segment_name,
        "Segment name must match created segment",
      ).toBe(segmentNameFromResp);

      expect(
        typeof resultById.data.in_segment,
        "in_segment must be a boolean",
      ).toBe("boolean");

      if (resultById.state === "results") {
        expect(
          resultById.data.risk_score,
          "Risk score must be present when in segment",
        ).not.toBeNull();
        expect(
          resultById.data.risk_tier,
          "Risk tier must be present when in segment",
        ).not.toBeNull();
      }
    }

    console.log(`✅ Search by ID — state: ${resultById.state}`);

    // =========================
    // 4. Search by segment name
    // =========================
    const resultByName = await screeningPage.searchBySegmentName(
      CUSTOMER_ID,
      segmentNameFromResp,
    );

    expect(
      ["results", "not-in-segment"],
      `Unexpected state "${resultByName.state}"`,
    ).toContain(resultByName.state);

    expect(
      resultByName.data.segment_name,
      "Segment name must be consistent between ID and name search",
    ).toBe(segmentNameFromResp);

    expect(
      resultByName.state,
      "Name search must return same state as ID search",
    ).toBe(resultById.state);

    console.log(`✅ Search by name — state: ${resultByName.state}`);

    // =========================
    // 5. Invalid segment ID → error
    // =========================
    const invalidResult = await screeningPage.searchBySegmentId(
      CUSTOMER_ID,
      "999999999",
    );
    console.log("invalidResult:", JSON.stringify(invalidResult, null, 2));
    expect(["error", "not-in-segment"]).toContain(invalidResult.state);

    expect(invalidResult.message).toBe("Segment not found");

    console.log(`✅ Invalid segment check — state: ${invalidResult.state}`);
    console.log("✅ Customer screening journey completed");
  });
});
