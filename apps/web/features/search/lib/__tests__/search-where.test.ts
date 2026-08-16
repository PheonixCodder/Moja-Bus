import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Prisma } from "@moja/db";
import { buildTripWhere } from "../../repositories/search-read-repository";
import type { SearchFilters } from "../../services/search-service";

const origin = {
  cityId: "cityA",
  municipalityId: null,
  quarterId: null,
  level: "city" as const,
};
const destination = {
  cityId: "cityB",
  municipalityId: null,
  quarterId: null,
  level: "city" as const,
};
const start = new Date("2026-08-02T00:00:00.000Z");
const end = new Date("2026-08-02T23:59:59.999Z");
const noFilters: SearchFilters = {
  operators: [],
  amenities: [],
  departureTime: [],
  seatClass: undefined,
  isExpress: undefined,
  maxPrice: undefined,
};

type WhereShape = Prisma.TripWhereInput;

function strip(w: WhereShape) {
  return {
    status: w.status,
    schedule: w.schedule,
    companyId: w.companyId,
    bus: w.bus,
    tripStops: w.tripStops,
    AND: w.AND,
  };
}

describe("buildTripWhere", () => {
  test("no extra filters -> only geo/date constraints", () => {
    const w = buildTripWhere(origin, destination, start, end, noFilters);
    assert.deepEqual(strip(w), {
      status: { in: ["SCHEDULED", "DELAYED", "BOARDING"] },
      schedule: { isActive: true },
      companyId: undefined,
      bus: undefined,
      tripStops: {
        some: {
          terminal: { cityId: "cityA" },
          isPickup: true,
          scheduledDeparture: { gte: start, lte: end },
        },
      },
      AND: {
        tripStops: {
          some: {
            terminal: { cityId: "cityB" },
            isDropoff: true,
          },
        },
      },
    });
  });

  test("operators filter narrows by companyId", () => {
    const w = buildTripWhere(origin, destination, start, end, {
      ...noFilters,
      operators: ["op1"],
    });
    assert.deepEqual(w.companyId, { in: ["op1"] });
  });

  test("seatClass filter narrows by bus.seatClass", () => {
    const w = buildTripWhere(origin, destination, start, end, {
      ...noFilters,
      seatClass: ["VIP"],
    });
    assert.deepEqual(w.bus, { seatClass: { in: ["VIP"] } });
  });

  test("amenities filter maps to layoutTemplate flags", () => {
    const w = buildTripWhere(origin, destination, start, end, {
      ...noFilters,
      amenities: ["AC", "WIFI"],
    });
    assert.deepEqual(w.bus, {
      layoutTemplate: { is: { hasAC: true, hasWifi: true } },
    });
  });

  test("departureTime MORNING adds hour window on origin stop", () => {
    const w = buildTripWhere(origin, destination, start, end, {
      ...noFilters,
      departureTime: ["MORNING"],
    });
    assert.deepEqual(w.tripStops, {
      some: {
        OR: [
          {
            terminal: { cityId: "cityA" },
            isPickup: true,
            scheduledDeparture: {
              gte: new Date("2026-08-02T05:00:00.000Z"),
              lt: new Date("2026-08-02T12:00:00.000Z"),
            },
          },
        ],
      },
    });
  });

  test("departureTime LATE_NIGHT expands to two hour ranges", () => {
    const w = buildTripWhere(origin, destination, start, end, {
      ...noFilters,
      departureTime: ["LATE_NIGHT"],
    });
    assert.deepEqual(w.tripStops, {
      some: {
        OR: [
          {
            terminal: { cityId: "cityA" },
            isPickup: true,
            scheduledDeparture: {
              gte: new Date("2026-08-02T22:00:00.000Z"),
              lt: new Date("2026-08-03T00:00:00.000Z"),
            },
          },
          {
            terminal: { cityId: "cityA" },
            isPickup: true,
            scheduledDeparture: {
              gte: new Date("2026-08-02T00:00:00.000Z"),
              lt: new Date("2026-08-02T05:00:00.000Z"),
            },
          },
        ],
      },
    });
  });
});
