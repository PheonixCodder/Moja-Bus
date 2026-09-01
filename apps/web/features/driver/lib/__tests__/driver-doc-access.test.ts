import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DRIVER_DOC_SEGMENTS,
  driverDocKeyMatches,
  driverPresignDocSchema,
  expectedDriverDocPrefix,
} from "../driver-doc-access";

const USER = "usr_abc123";

describe("expectedDriverDocPrefix", () => {
  it("maps every doc type to its purpose key segment", () => {
    assert.equal(
      expectedDriverDocPrefix(USER, "driver-license-front"),
      `documents/drivers/${USER}/license-front/`,
    );
    assert.equal(
      expectedDriverDocPrefix(USER, "driver-license-back"),
      `documents/drivers/${USER}/license-back/`,
    );
    assert.equal(
      expectedDriverDocPrefix(USER, "driver-medical-doc"),
      `documents/drivers/${USER}/medical/`,
    );
  });

  it("keeps segments in sync with the purposes registry naming", () => {
    // Guard against someone renaming a segment here but not in purposes.ts
    assert.deepEqual(Object.keys(DRIVER_DOC_SEGMENTS).sort(), [
      "driver-license-back",
      "driver-license-front",
      "driver-medical-doc",
      "driver-selfie",
    ]);
  });
});

describe("driverDocKeyMatches", () => {
  it("accepts keys minted for this driver under the matching segment", () => {
    for (const docType of Object.keys(DRIVER_DOC_SEGMENTS) as Array<
      keyof typeof DRIVER_DOC_SEGMENTS
    >) {
      const key = `${expectedDriverDocPrefix(USER, docType)}uuid-scan.jpg`;
      assert.equal(driverDocKeyMatches(USER, docType, key), true, docType);
    }
  });

  it("rejects another driver's key even for the same doc type", () => {
    const otherUser = "usr_other999";
    const key = `${expectedDriverDocPrefix(otherUser, "driver-license-front")}uuid-scan.jpg`;
    assert.equal(driverDocKeyMatches(USER, "driver-license-front", key), false);
  });

  it("rejects a segment/type mismatch (front key claimed as medical)", () => {
    const frontKey = `${expectedDriverDocPrefix(USER, "driver-license-front")}uuid-scan.pdf`;
    assert.equal(
      driverDocKeyMatches(USER, "driver-medical-doc", frontKey),
      false,
    );
  });

  it("rejects non-namespaced values (legacy https / device URIs)", () => {
    assert.equal(
      driverDocKeyMatches(
        USER,
        "driver-license-front",
        "https://cdn.example.com/x.jpg",
      ),
      false,
    );
    assert.equal(
      driverDocKeyMatches(
        USER,
        "driver-medical-doc",
        "file:///data/0/scan.jpg",
      ),
      false,
    );
  });

  it("requires the FULL prefix including trailing slash", () => {
    const lookalike = `documents/drivers/${USER}/license-front-evil/x.jpg`;
    assert.equal(
      driverDocKeyMatches(USER, "driver-license-front", lookalike),
      false,
    );
  });
});

describe("driverPresignDocSchema", () => {
  it("accepts a well-formed request", () => {
    const parsed = driverPresignDocSchema.parse({
      driverProfileId: "ckt9v2p8q0000abcd1234567",
      docType: "driver-license-front",
      objectKey: `documents/drivers/${USER}/license-front/u-scan.jpg`,
    });
    assert.equal(parsed.docType, "driver-license-front");
  });

  it("rejects unknown doc types and empty keys", () => {
    assert.throws(() =>
      driverPresignDocSchema.parse({
        driverProfileId: "cktb0000aaaa1234567",
        docType: "invalid-type" as any,
        objectKey: "documents/drivers/x/selfie/u.jpg",
      }),
    );
    assert.throws(() =>
      driverPresignDocSchema.parse({
        driverProfileId: "cktb0000aaaa1234567",
        docType: "driver-medical-doc",
        objectKey: "",
      }),
    );
  });
});

describe("canDriverInvokeMutation (Phase 2E / DRV-P1-08)", () => {
  it("allows VERIFIED drivers to invoke any operational or self-service mutation", async () => {
    const { canDriverInvokeMutation } = await import(
      "@/lib/driver-authorization"
    );
    assert.equal(canDriverInvokeMutation("VERIFIED", null, "startTrip"), true);
    assert.equal(canDriverInvokeMutation("VERIFIED", null, "toggleShift"), true);
    assert.equal(canDriverInvokeMutation("VERIFIED", null, "checkInPassenger"), true);
    assert.equal(canDriverInvokeMutation("VERIFIED", null, "reportTripDelay"), true);
    assert.equal(canDriverInvokeMutation("VERIFIED", null, "reportVehicleBreakdown"), true);
    assert.equal(canDriverInvokeMutation("VERIFIED", null, "respondToOffer"), true);
  });

  it("allows unverified (PENDING / REJECTED / EXPIRED) idle drivers to invoke ONLY self-service allowlisted mutations", async () => {
    const { canDriverInvokeMutation } = await import(
      "@/lib/driver-authorization"
    );
    for (const status of ["PENDING", "REJECTED", "EXPIRED"]) {
      // Allowed self-service mutations
      assert.equal(canDriverInvokeMutation(status, null, "respondToOffer"), true, `${status} respondToOffer`);
      assert.equal(canDriverInvokeMutation(status, null, "setServicePreference"), true, `${status} setServicePreference`);
      assert.equal(canDriverInvokeMutation(status, null, "presignLicenseDoc"), true, `${status} presignLicenseDoc`);
      assert.equal(canDriverInvokeMutation(status, null, "markMyOffersSeen"), true, `${status} markMyOffersSeen`);
      assert.equal(canDriverInvokeMutation(status, null, "acknowledgeUrgentDispatch"), true, `${status} acknowledgeUrgentDispatch`);

      // Blocked operational mutations
      assert.equal(canDriverInvokeMutation(status, null, "startTrip"), false, `${status} startTrip`);
      assert.equal(canDriverInvokeMutation(status, null, "toggleShift"), false, `${status} toggleShift`);
      assert.equal(canDriverInvokeMutation(status, null, "checkInPassenger"), false, `${status} checkInPassenger`);
      assert.equal(canDriverInvokeMutation(status, null, "manualCheckInPassenger"), false, `${status} manualCheckInPassenger`);
      assert.equal(canDriverInvokeMutation(status, null, "batchSyncCheckIns"), false, `${status} batchSyncCheckIns`);
      assert.equal(canDriverInvokeMutation(status, null, "recordStopArrival"), false, `${status} recordStopArrival`);
      assert.equal(canDriverInvokeMutation(status, null, "recordStopDeparture"), false, `${status} recordStopDeparture`);
      assert.equal(canDriverInvokeMutation(status, null, "reportTripDelay"), false, `${status} reportTripDelay`);
      assert.equal(canDriverInvokeMutation(status, null, "reportVehicleBreakdown"), false, `${status} reportVehicleBreakdown`);
      assert.equal(canDriverInvokeMutation(status, null, "handoverTripControl"), false, `${status} handoverTripControl`);
    }
  });

  it("permits in-flight safety mutations for mid-run drivers under Phase 06 never-strand invariant", async () => {
    const { canDriverInvokeMutation } = await import(
      "@/lib/driver-authorization"
    );
    // Driver whose license expired mid-run (currentTripId = "trip-active-123")
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "completeTrip"), true);
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "reportTripDelay"), true);
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "reportVehicleBreakdown"), true);
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "recordStopArrival"), true);
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "checkInPassenger"), true);

    // But cannot start NEW trips or clock on NEW shifts
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "startTrip"), false);
    assert.equal(canDriverInvokeMutation("EXPIRED", "trip-active-123", "toggleShift"), false);
  });
});
