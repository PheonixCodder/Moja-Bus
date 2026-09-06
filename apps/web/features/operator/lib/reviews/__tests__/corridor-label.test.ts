import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reviewCorridorLabel } from "../corridor-label";

describe("reviewCorridorLabel", () => {
  it("prefers schedule route city names", () => {
    assert.equal(
      reviewCorridorLabel({
        scheduleRoute: {
          name: "Ignored Express",
          originTerminal: {
            cityRelation: { name: "Abidjan" },
            name: "Terminal A",
          },
          destTerminal: {
            cityRelation: { name: "Bouaké" },
            name: "Terminal B",
          },
        },
        routeSnapshotJson: { name: "Snapshot Name" },
      }),
      "Abidjan → Bouaké",
    );
  });

  it("falls back to snapshot terminal cities", () => {
    assert.equal(
      reviewCorridorLabel({
        scheduleRoute: null,
        routeSnapshotJson: {
          originTerminal: { cityRelation: { name: "Yamoussoukro" } },
          destTerminal: { city: "Man" },
        },
      }),
      "Yamoussoukro → Man",
    );
  });

  it("falls back to snapshot route name", () => {
    assert.equal(
      reviewCorridorLabel({
        scheduleRoute: null,
        routeSnapshotJson: { name: "Abidjan – Bouaké Express" },
      }),
      "Abidjan – Bouaké Express",
    );
  });

  it("returns empty placeholder when nothing is available", () => {
    assert.equal(reviewCorridorLabel({ scheduleRoute: null }), "—");
    assert.equal(
      reviewCorridorLabel({ scheduleRoute: null, empty: "Unknown" }),
      "Unknown",
    );
  });
});
