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

  describe("sales-cutoff clamp (now passed)", () => {
    // Searching the Aug 2 day window at 14:00 on Aug 2 → cutoff 14:30.
    const nowMidDay = new Date("2026-08-02T14:00:00.000Z");

    test("plain branch lower bound clamps up to now + 30min", () => {
      const w = buildTripWhere(
        origin,
        destination,
        start,
        end,
        noFilters,
        nowMidDay,
      );
      assert.deepEqual(w.tripStops, {
        some: {
          terminal: { cityId: "cityA" },
          isPickup: true,
          // A 09:00 departure can no longer match; a 16:00 one still does.
          scheduledDeparture: {
            gte: new Date("2026-08-02T14:30:00.000Z"),
            lte: end,
          },
        },
      });
    });

    test("cutoff before window start leaves the range untouched", () => {
      const w = buildTripWhere(
        origin,
        destination,
        start,
        end,
        noFilters,
        new Date("2026-08-01T23:30:00.000Z"), // cutoff == Aug 2 00:00 == start
      );
      assert.deepEqual((w.tripStops as any).some.scheduledDeparture, {
        gte: start,
        lte: end,
      });
    });

    test("MORNING filter fully in the past collapses to an impossible condition", () => {
      const w = buildTripWhere(
        origin,
        destination,
        start,
        end,
        {
          ...noFilters,
          departureTime: ["MORNING"],
        },
        nowMidDay,
      );
      assert.deepEqual(w.tripStops, {
        some: {
          terminal: { cityId: "cityA" },
          isPickup: true,
          scheduledDeparture: {
            gte: new Date("2026-08-02T14:30:00.000Z"),
            lt: new Date("2026-08-02T14:30:00.000Z"),
          },
        },
      });
    });

    test("LATE_NIGHT early-morning sub-range dropped, evening sub-range kept", () => {
      const w = buildTripWhere(
        origin,
        destination,
        start,
        end,
        {
          ...noFilters,
          departureTime: ["LATE_NIGHT"],
        },
        new Date("2026-08-02T06:00:00.000Z"),
      ); // cutoff 06:30
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
          ],
        },
      });
    });

    test("LATE_NIGHT at 23:30 drops both sub-ranges (23:45 departs inside cutoff)", () => {
      const w = buildTripWhere(
        origin,
        destination,
        start,
        end,
        {
          ...noFilters,
          departureTime: ["LATE_NIGHT"],
        },
        new Date("2026-08-02T23:30:00.000Z"),
      ); // cutoff Aug 3 00:00
      assert.deepEqual(w.tripStops, {
        some: {
          terminal: { cityId: "cityA" },
          isPickup: true,
          scheduledDeparture: {
            gte: new Date("2026-08-03T00:00:00.000Z"),
            lt: new Date("2026-08-03T00:00:00.000Z"),
          },
        },
      });
    });

    test("future date unaffected by now", () => {
      const futureStart = new Date("2026-08-10T00:00:00.000Z");
      const futureEnd = new Date("2026-08-10T23:59:59.999Z");
      const w = buildTripWhere(
        origin,
        destination,
        futureStart,
        futureEnd,
        noFilters,
        nowMidDay,
      );
      assert.deepEqual((w.tripStops as any).some.scheduledDeparture, {
        gte: futureStart,
        lte: futureEnd,
      });
    });

    test("fully-past searched date yields an impossible range -> zero rows", () => {
      const pastStart = new Date("2026-08-01T00:00:00.000Z");
      const pastEnd = new Date("2026-08-01T23:59:59.999Z");
      const w = buildTripWhere(
        origin,
        destination,
        pastStart,
        pastEnd,
        noFilters,
        nowMidDay,
      );
      assert.deepEqual((w.tripStops as any).some.scheduledDeparture, {
        gte: new Date("2026-08-02T14:30:00.000Z"),
        lte: pastEnd,
      });
      assert.ok(
        (w.tripStops as any).some.scheduledDeparture.gte >
          (w.tripStops as any).some.scheduledDeparture.lte,
      );
    });
  });
});
