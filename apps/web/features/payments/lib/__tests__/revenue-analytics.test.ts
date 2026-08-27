import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aggregateRevenueRows } from "../revenue-analytics";

function row(opts: {
  day: string;
  originCity?: string | null;
  destCity?: string | null;
  net?: bigint;
  gross?: bigint;
  bookingsCount?: bigint;
  tripsCount?: bigint;
}) {
  return {
    day: new Date(opts.day),
    originCity: opts.originCity ?? null,
    destCity: opts.destCity ?? null,
    net: opts.net ?? 0n,
    gross: opts.gross ?? 0n,
    bookingsCount: opts.bookingsCount ?? 0n,
    tripsCount: opts.tripsCount ?? 0n,
  };
}

describe("aggregateRevenueRows", () => {
  it("aggregates a single row correctly", () => {
    const result = aggregateRevenueRows([
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: "Abidjan",
        destCity: "Bouake",
        net: 1000n,
        gross: 1500n,
        bookingsCount: 2n,
        tripsCount: 1n,
      }),
    ]);

    assert.equal(result.grossRevenueXOF, 1500);
    assert.equal(result.netRevenueXOF, 1000);
    assert.equal(result.totalConfirmedBookings, 2);
    assert.equal(result.timeSeriesMap.size, 1);
    assert.equal(result.routeMap.size, 1);
  });

  it("aggregates rows across multiple days", () => {
    const result = aggregateRevenueRows([
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: "Abidjan",
        destCity: "Bouake",
        net: 1000n,
        gross: 1500n,
        bookingsCount: 2n,
        tripsCount: 1n,
      }),
      row({
        day: "2025-01-16T05:00:00Z",
        originCity: "Abidjan",
        destCity: "Bouake",
        net: 2000n,
        gross: 3000n,
        bookingsCount: 3n,
        tripsCount: 1n,
      }),
    ]);

    assert.equal(result.netRevenueXOF, 3000);
    assert.equal(result.grossRevenueXOF, 4500);
    assert.equal(result.totalConfirmedBookings, 5);
    assert.equal(result.timeSeriesMap.size, 2);
  });

  it("merges rows with same date and route", () => {
    const result = aggregateRevenueRows([
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: "Abidjan",
        destCity: "Bouake",
        net: 1000n,
        gross: 1500n,
        bookingsCount: 2n,
        tripsCount: 1n,
      }),
      row({
        day: "2025-01-15T07:00:00Z",
        originCity: "Abidjan",
        destCity: "Bouake",
        net: 500n,
        gross: 750n,
        bookingsCount: 1n,
        tripsCount: 1n,
      }),
    ]);

    assert.equal(result.timeSeriesMap.size, 1);
    assert.equal(result.routeMap.size, 1);
    const tsVal = Array.from(result.timeSeriesMap.values())[0]!;
    assert.equal(tsVal.netXOF, 1500);
  });

  it("handles archived/schedule-less trips where origin or dest city is null (regression A7a)", () => {
    const result = aggregateRevenueRows([
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: null,
        destCity: null,
        net: 1000n,
        gross: 1500n,
        bookingsCount: 2n,
        tripsCount: 1n,
      }),
    ]);

    assert.equal(result.grossRevenueXOF, 1500);
    assert.equal(result.netRevenueXOF, 1000);
    assert.equal(result.totalConfirmedBookings, 2);

    const routeEntry = Array.from(result.routeMap.values())[0]!;
    assert.equal(routeEntry.routeLabel, "Unknown → Unknown");
  });

  it("returns zero totals for an empty array", () => {
    const result = aggregateRevenueRows([]);
    assert.equal(result.grossRevenueXOF, 0);
    assert.equal(result.netRevenueXOF, 0);
    assert.equal(result.totalConfirmedBookings, 0);
    assert.equal(result.timeSeriesMap.size, 0);
    assert.equal(result.routeMap.size, 0);
  });

  it("produces route entries with correct structure", () => {
    const result = aggregateRevenueRows([
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: "Abidjan",
        destCity: "Bouake",
        net: 1000n,
        gross: 1500n,
        bookingsCount: 2n,
        tripsCount: 1n,
      }),
    ]);

    const routeEntry = Array.from(result.routeMap.values())[0]!;
    assert.equal(routeEntry.routeLabel, "Abidjan → Bouake");
    assert.equal(routeEntry.totalNetXOF, 1000);
    assert.equal(routeEntry.bookingsCount, 2);
    assert.equal(routeEntry.tripsCount, 1);
    assert.equal(routeEntry.refundsCount, 0);
  });

  it("handles partial null cities (origin only)", () => {
    const result = aggregateRevenueRows([
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: "Abidjan",
        destCity: null,
        net: 500n,
        gross: 750n,
        bookingsCount: 1n,
        tripsCount: 1n,
      }),
      row({
        day: "2025-01-15T05:00:00Z",
        originCity: null,
        destCity: "Bouake",
        net: 500n,
        gross: 750n,
        bookingsCount: 1n,
        tripsCount: 1n,
      }),
    ]);

    assert.equal(result.routeMap.size, 2);
    const routes = Array.from(result.routeMap.values());
    assert.equal(routes[0]!.routeLabel, "Abidjan → Unknown");
    assert.equal(routes[1]!.routeLabel, "Unknown → Bouake");
    assert.equal(result.netRevenueXOF, 1000);
  });
});
