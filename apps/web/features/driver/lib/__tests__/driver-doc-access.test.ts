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
