// =============================================================
// ScreeningResponseHandler.js
// PURPOSE: Parses and normalizes screening API responses.
//          Kept separate from ScreeningPage so the page object
//          stays focused on UI interactions only.
//
// To add a new response shape: add a branch in normalizeResponse.
//
// Confirmed API response shapes:
//
// Success:
// {
//   success: true, message: "Screening completed successfully",
//   customer_id, in_segment, segment_id, segment_name,
//   segment_row_id, risk_score, risk_tier, segment_status,
//   credit_score_cutoff, error: null
// }
//
// Not found:
// { detail: "Segment not found" }
//
// Validation failure:
// { success: false, message: "..." }
// =============================================================

export class ScreeningResponseHandler {
  // ─────────────────────────────────────────────────────────────
  // Parses raw Playwright Response into a consistent shape.
  //
  // Returns one of:
  //   { state: 'results',        data: json }  — customer in segment
  //   { state: 'not-in-segment', data: json }  — customer not in segment
  //   { state: 'validation',     message, data: json }
  //   { state: 'error',          message, data: json }
  //   { state: 'unknown',        message, data: json }
  // ─────────────────────────────────────────────────────────────
  async normalizeResponse(response) {
    let json;

    try {
      json = await response.json();
    } catch {
      throw new Error(
        "[ScreeningResponseHandler] Failed to parse API response",
      );
    }

    console.log("🔎 Screening API response:", JSON.stringify(json, null, 2));

    // FastAPI exception — always check first, has no in_segment field
    if (json.detail) {
      return { state: "error", message: json.detail, data: json };
    }

    // Explicit error field — non-null means backend reported an error
    // Note: success response has error: null so check explicitly
    if (json.error !== null && json.error !== undefined) {
      return { state: "error", message: json.error, data: json };
    }

    // Form or request validation failure
    if (json.success === false) {
      return { state: "validation", message: json.message, data: json };
    }

    // Normal business result — in_segment boolean drives the state
    if (typeof json.in_segment === "boolean") {
      return {
        state: json.in_segment ? "results" : "not-in-segment",
        data: json,
      };
    }

    // Unexpected shape — surface for investigation
    return {
      state: "unknown",
      message: "Unexpected API response structure",
      data: json,
    };
  }
}
