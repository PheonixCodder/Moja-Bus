import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  areRequiredDocumentsApproved,
  getDocumentsVerificationState,
} from "../company-status";

describe("getDocumentsVerificationState", () => {
  it("returns missing when a required type is absent", () => {
    assert.equal(
      getDocumentsVerificationState([
        {
          type: "BUSINESS_REGISTRATION_CERTIFICATE",
          status: "PENDING",
        },
        { type: "TRANSPORT_OPERATING_PERMIT", status: "PENDING" },
      ]),
      "missing",
    );
  });

  it("returns pending when all required types exist but are not approved", () => {
    assert.equal(
      getDocumentsVerificationState([
        {
          type: "BUSINESS_REGISTRATION_CERTIFICATE",
          status: "PENDING",
        },
        { type: "TAX_CLEARANCE_CERTIFICATE", status: "PENDING" },
        { type: "TRANSPORT_OPERATING_PERMIT", status: "APPROVED" },
      ]),
      "pending",
    );
  });

  it("returns approved only when all three required docs are APPROVED", () => {
    const docs = [
      {
        type: "BUSINESS_REGISTRATION_CERTIFICATE",
        status: "APPROVED",
      },
      { type: "TAX_CLEARANCE_CERTIFICATE", status: "APPROVED" },
      { type: "TRANSPORT_OPERATING_PERMIT", status: "APPROVED" },
      { type: "INSURANCE_CERTIFICATE", status: "PENDING" },
    ];
    assert.equal(getDocumentsVerificationState(docs), "approved");
    assert.equal(areRequiredDocumentsApproved(docs), true);
  });
});
