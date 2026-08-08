import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDepartureTime } from "../departure-times-editor";

describe("addDepartureTime", () => {
  it("adds a new valid time sorted and deduplicated", () => {
    const result = addDepartureTime(["07:00", "09:00"], "08:00");
    assert.equal(result.added, true);
    assert.deepEqual(result.times, ["07:00", "08:00", "09:00"]);
  });

  it("returns added=false when the time is already present", () => {
    const result = addDepartureTime(["07:00", "09:00"], "09:00");
    assert.equal(result.added, false);
    assert.deepEqual(result.times, ["07:00", "09:00"]);
  });

  it("ignores invalid formats", () => {
    const result = addDepartureTime(["07:00"], "25:99");
    assert.equal(result.added, false);
    assert.deepEqual(result.times, ["07:00"]);
  });
});
