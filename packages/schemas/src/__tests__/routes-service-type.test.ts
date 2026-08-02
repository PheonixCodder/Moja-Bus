import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRouteSchema, updateRouteSchema } from "../routes";

const validCreateInput = {
  name: "Abidjan - Bouaké Express",
  originTerminalId: "t1",
  destTerminalId: "t2",
};

describe("createRouteSchema serviceType", () => {
  it("accepts URBAN", () => {
    const result = createRouteSchema.safeParse({
      ...validCreateInput,
      serviceType: "URBAN",
    });
    assert.equal(result.success, true);
    assert.equal(result.data?.serviceType, "URBAN");
  });

  it("accepts INTERCITY", () => {
    const result = createRouteSchema.safeParse({
      ...validCreateInput,
      serviceType: "INTERCITY",
    });
    assert.equal(result.success, true);
    assert.equal(result.data?.serviceType, "INTERCITY");
  });

  it("is optional (defaults to undefined)", () => {
    const result = createRouteSchema.safeParse(validCreateInput);
    assert.equal(result.success, true);
    assert.equal(result.data?.serviceType, undefined);
  });

  it("rejects an invalid value", () => {
    const result = createRouteSchema.safeParse({
      ...validCreateInput,
      serviceType: "EXPRESS",
    });
    assert.equal(result.success, false);
  });

  it("rejects the same origin and destination regardless of serviceType", () => {
    const result = createRouteSchema.safeParse({
      ...validCreateInput,
      originTerminalId: "t1",
      destTerminalId: "t1",
      serviceType: "INTERCITY",
    });
    assert.equal(result.success, false);
    const error = JSON.stringify(result.error.issues);
    assert.match(error, /Origin and destination terminals must be different/);
  });
});

describe("updateRouteSchema serviceType", () => {
  it("accepts URBAN", () => {
    const result = updateRouteSchema.safeParse({ serviceType: "URBAN" });
    assert.equal(result.success, true);
    assert.equal(result.data?.serviceType, "URBAN");
  });

  it("accepts INTERCITY", () => {
    const result = updateRouteSchema.safeParse({ serviceType: "INTERCITY" });
    assert.equal(result.success, true);
    assert.equal(result.data?.serviceType, "INTERCITY");
  });

  it("is optional", () => {
    const result = updateRouteSchema.safeParse({ name: "Renamed" });
    assert.equal(result.success, true);
    assert.equal(result.data?.serviceType, undefined);
  });

  it("rejects an invalid value", () => {
    const result = updateRouteSchema.safeParse({ serviceType: "EXPRESS" });
    assert.equal(result.success, false);
  });
});
