import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRPCError } from "@trpc/server";
import { DriverCheckInService } from "@/features/driver/services/driver-check-in-service";

// Phase 03 (F-IN-01 ≡ F-DV-03) — check-in authorization binding suite.

const DRIVER_A = "driver-a";
const DRIVER_B = "driver-b";
const COMPANY_A = "company-a";
const TRIP_X = "trip-x";
const TRIP_Y = "trip-y";

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    companyId: COMPANY_A,
    tripId: TRIP_X,
    status: "CONFIRMED",
    bookingReference: "MR-TEST01",
    passengerName: "Jane Doe",
    passengerPhone: "+2250700000000",
    ticketToken: "tok-abc",
    boardedAt: null as Date | null,
    checkedInAt: null as Date | null,
    seat: { label: "A1" },
    trip: { id: TRIP_X, status: "SCHEDULED" },
    ...overrides,
  };
}

type Handlers = {
  findTokenBooking?: (args: unknown) => Promise<unknown>;
  findManualBooking?: (args: unknown) => Promise<unknown>;
  updateBooking?: (args: unknown) => Promise<unknown>;
  updateManyBooking?: (args: unknown) => Promise<unknown>;
  findAssignment?: (args: unknown) => Promise<unknown>;
};

function createMockPrisma(handlers: Handlers = {}) {
  return {
    booking: {
      findUnique: handlers.findTokenBooking ?? (async () => null),
      findFirst: handlers.findManualBooking ?? (async () => null),
      update:
        handlers.updateBooking ?? (async () => ({ boardedAt: new Date() })),
      updateMany:
        handlers.updateManyBooking ??
        (async (args) => {
          if (handlers.updateBooking) {
            await handlers.updateBooking(args);
          }
          return { count: 1 };
        }),
    },
    tripDriverAssignment: {
      // Default: caller holds an assignment (any role — queries are role-blind).
      findFirst: handlers.findAssignment ?? (async () => ({ id: "asg-1" })),
    },
    trip: {
      findUnique: async () => null,
    },
  } as unknown as ConstructorParameters<typeof DriverCheckInService>[0];
}

async function assertThrows(fn: () => Promise<unknown>, code: string) {
  try {
    await fn();
  } catch (err) {
    assert.ok(
      err instanceof TRPCError,
      `expected TRPCError, got ${String(err)}`,
    );
    assert.equal(err.code, code);
    return err;
  }
  assert.fail(`Expected TRPCError ${code} but nothing was thrown`);
}

describe("DriverCheckInService.scanCheckIn", () => {
  it("boards a CONFIRMED booking for an assigned driver", async () => {
    let updatedArgs: unknown;
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
      updateBooking: async (args) => {
        updatedArgs = args;
        return { boardedAt: new Date("2026-08-23T09:00:00Z") };
      },
    });

    const result = await new DriverCheckInService(prisma).scanCheckIn(
      DRIVER_A,
      {
        ticketToken: "tok-abc",
      },
    );

    assert.equal(result.success, true);
    assert.equal(result.alreadyBoarded, false);
    assert.equal(result.passengerName, "Jane Doe");
    assert.equal(result.seatNumber, "A1");
    assert.equal(result.bookingReference, "MR-TEST01");
    const data = (
      updatedArgs as {
        data: { boardedAt?: unknown; checkedInAt?: unknown };
      }
    ).data;
    assert.ok(data.boardedAt instanceof Date);
    assert.ok(data.checkedInAt instanceof Date);
  });

  it("accepts a matching client-declared tripId", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
    });

    const result = await new DriverCheckInService(prisma).scanCheckIn(
      DRIVER_A,
      {
        ticketToken: "tok-abc",
        tripId: TRIP_X,
      },
    );

    assert.equal(result.alreadyBoarded, false);
  });

  it("returns idempotent alreadyBoarded without writing", async () => {
    let updateCalled = false;
    const boardedAt = new Date("2026-08-23T08:30:00Z");
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking({ boardedAt }),
      updateBooking: async () => {
        updateCalled = true;
        return {};
      },
    });

    const result = await new DriverCheckInService(prisma).scanCheckIn(
      DRIVER_A,
      {
        ticketToken: "tok-abc",
      },
    );

    assert.equal(result.success, false);
    assert.equal(result.alreadyBoarded, true);
    assert.equal(result.boardedAt, boardedAt);
    assert.equal(updateCalled, false);
  });

  it("rejects an unknown token with NOT_FOUND", async () => {
    const prisma = createMockPrisma();
    await assertThrows(
      () =>
        new DriverCheckInService(prisma).scanCheckIn(DRIVER_A, {
          ticketToken: "tok-ghost",
        }),
      "NOT_FOUND",
    );
  });

  it("rejects an unassigned driver with FORBIDDEN and never writes", async () => {
    let updateCalled = false;
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
      findAssignment: async () => null,
      updateBooking: async () => {
        updateCalled = true;
        return {};
      },
    });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).scanCheckIn(DRIVER_B, {
          ticketToken: "tok-abc",
        }),
      "FORBIDDEN",
    );
    assert.equal(updateCalled, false);
  });

  it("rejects a cross-trip declaration with BAD_REQUEST", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking({ tripId: TRIP_X }),
    });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).scanCheckIn(DRIVER_A, {
          ticketToken: "tok-abc",
          tripId: TRIP_Y,
        }),
      "BAD_REQUEST",
    );
  });

  for (const status of [
    "PENDING_PAYMENT",
    "CANCELLED",
    "REFUND_PENDING",
    "EXPIRED",
  ] as const) {
    it(`rejects a ${status} booking with PRECONDITION_FAILED`, async () => {
      const prisma = createMockPrisma({
        findTokenBooking: async () => makeBooking({ status }),
      });

      await assertThrows(
        () =>
          new DriverCheckInService(prisma).scanCheckIn(DRIVER_A, {
            ticketToken: "tok-abc",
          }),
        "PRECONDITION_FAILED",
      );
    });
  }

  it("rejects boarding when the trip is CANCELLED", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () =>
        makeBooking({ trip: { id: TRIP_X, status: "CANCELLED" } }),
    });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).scanCheckIn(DRIVER_A, {
          ticketToken: "tok-abc",
        }),
      "BAD_REQUEST",
    );
  });

  it("rejects boarding after ARRIVED", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () =>
        makeBooking({ trip: { id: TRIP_X, status: "ARRIVED" } }),
    });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).scanCheckIn(DRIVER_A, {
          ticketToken: "tok-abc",
        }),
      "BAD_REQUEST",
    );
  });

  it("allows boarding on a DEPARTED run", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () =>
        makeBooking({ trip: { id: TRIP_X, status: "DEPARTED" } }),
    });

    const result = await new DriverCheckInService(prisma).scanCheckIn(
      DRIVER_A,
      {
        ticketToken: "tok-abc",
      },
    );
    assert.equal(result.success, true);
  });
});

describe("DriverCheckInService.manualCheckIn", () => {
  function manualPrisma(handlers: Handlers = {}) {
    return createMockPrisma({
      findManualBooking: async () => makeBooking(),
      ...handlers,
    });
  }

  it("boards a CONFIRMED booking found on the declared trip", async () => {
    let updateCalled = false;
    const prisma = manualPrisma({
      updateBooking: async () => {
        updateCalled = true;
        return {};
      },
    });

    const result = await new DriverCheckInService(prisma).manualCheckIn(
      DRIVER_A,
      { bookingId: "booking-1", tripId: TRIP_X },
    );

    assert.equal(result.success, true);
    assert.equal(result.alreadyBoarded, false);
    assert.equal(result.passengerName, "Jane Doe");
    assert.ok(updateCalled);
  });

  it("rejects when the booking is not on that trip", async () => {
    const prisma = createMockPrisma({ findManualBooking: async () => null });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).manualCheckIn(DRIVER_A, {
          bookingId: "booking-1",
          tripId: TRIP_X,
        }),
      "NOT_FOUND",
    );
  });

  it("rejects an unassigned driver with FORBIDDEN", async () => {
    const prisma = manualPrisma({ findAssignment: async () => null });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).manualCheckIn(DRIVER_B, {
          bookingId: "booking-1",
          tripId: TRIP_X,
        }),
      "FORBIDDEN",
    );
  });

  it("rejects a CANCELLED booking (guard previously absent)", async () => {
    const prisma = manualPrisma({
      findManualBooking: async () => makeBooking({ status: "CANCELLED" }),
    });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).manualCheckIn(DRIVER_A, {
          bookingId: "booking-1",
          tripId: TRIP_X,
        }),
      "PRECONDITION_FAILED",
    );
  });

  it("rejects a PENDING_PAYMENT booking (guard previously absent)", async () => {
    const prisma = manualPrisma({
      findManualBooking: async () => makeBooking({ status: "PENDING_PAYMENT" }),
    });

    await assertThrows(
      () =>
        new DriverCheckInService(prisma).manualCheckIn(DRIVER_A, {
          bookingId: "booking-1",
          tripId: TRIP_X,
        }),
      "PRECONDITION_FAILED",
    );
  });

  it("returns idempotent alreadyBoarded without writing", async () => {
    let updateCalled = false;
    const prisma = manualPrisma({
      findManualBooking: async () =>
        makeBooking({ boardedAt: new Date("2026-08-23T08:30:00Z") }),
      updateBooking: async () => {
        updateCalled = true;
        return {};
      },
    });

    const result = await new DriverCheckInService(prisma).manualCheckIn(
      DRIVER_A,
      { bookingId: "booking-1", tripId: TRIP_X },
    );

    assert.equal(result.alreadyBoarded, true);
    assert.equal(updateCalled, false);
  });
});

describe("DriverCheckInService.assignment binding", () => {
  it("queries assignments without a role filter (all crew roles may board)", async () => {
    let capturedWhere:
      | { driverProfileId?: string; tripId?: string; role?: string }
      | undefined;
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
      findAssignment: async (args) => {
        capturedWhere = (
          args as { where: { driverProfileId?: string; tripId?: string } }
        ).where;
        return { id: "asg-conductor" };
      },
    });

    await new DriverCheckInService(prisma).scanCheckIn(DRIVER_A, {
      ticketToken: "tok-abc",
    });

    assert.ok(capturedWhere);
    assert.equal(capturedWhere.driverProfileId, DRIVER_A);
    assert.equal(capturedWhere.tripId, TRIP_X);
    assert.equal("role" in capturedWhere, false);
  });
});

describe("DriverCheckInService.batchSync", () => {
  const SCANNED_AT = new Date("2026-08-23T07:45:00Z");

  it("reports each item independently instead of swallowing", async () => {
    const updates: Array<{ id: string; boardedAt: Date }> = [];
    const prisma = createMockPrisma({
      // Caller crews TRIP_X only — anything else must reject.
      findAssignment: async (args) =>
        (args as { where: { tripId: string } }).where.tripId === TRIP_X
          ? { id: "asg-1" }
          : null,
      findTokenBooking: async (args) => {
        const token = (args as { where: { ticketToken: string } }).where
          .ticketToken;
        switch (token) {
          case "tok-mismatch":
            return makeBooking({ id: "b-mismatch", ticketToken: token });
          case "tok-unassigned":
            return makeBooking({
              id: "b-unassigned",
              ticketToken: token,
              tripId: TRIP_Y,
              trip: { id: TRIP_Y, status: "SCHEDULED" },
            });
          case "tok-unpaid":
            return makeBooking({
              id: "b-unpaid",
              ticketToken: token,
              status: "PENDING_PAYMENT",
            });
          case "tok-boarded":
            return makeBooking({
              id: "b-boarded",
              ticketToken: token,
              boardedAt: new Date("2026-08-23T07:00:00Z"),
            });
          case "tok-ok":
            return makeBooking({ id: "b-ok", ticketToken: token });
          default:
            return null;
        }
      },
      updateBooking: async (args) => {
        const a = args as { where: { id: string }; data: { boardedAt: Date } };
        updates.push({ id: a.where.id, boardedAt: a.data.boardedAt });
        return { boardedAt: a.data.boardedAt };
      },
    });

    const result = await new DriverCheckInService(prisma).batchSync(DRIVER_A, [
      { ticketToken: "tok-ghost", scannedAt: SCANNED_AT },
      { ticketToken: "tok-mismatch", tripId: TRIP_Y, scannedAt: SCANNED_AT },
      { ticketToken: "tok-unassigned", scannedAt: SCANNED_AT },
      { ticketToken: "tok-unpaid", scannedAt: SCANNED_AT },
      { ticketToken: "tok-boarded", scannedAt: SCANNED_AT },
      { ticketToken: "tok-ok", scannedAt: SCANNED_AT },
    ]);

    assert.equal(result.results.length, 6);
    assert.deepEqual(
      result.results.map((r) => r.outcome),
      [
        "REJECTED", // unknown token
        "REJECTED", // wrong trip declared
        "REJECTED", // not assigned to booking's trip
        "REJECTED", // unpaid
        "ALREADY_BOARDED",
        "SYNCED",
      ],
    );
    assert.equal(result.syncedCount, 1);

    // Only the valid item was written, honoring the offline scan time.
    assert.equal(updates.length, 1);
    const written = updates[0];
    assert.ok(written);
    assert.equal(written.id, "b-ok");
    assert.equal(written.boardedAt.getTime(), SCANNED_AT.getTime());
  });

  it("propagates unexpected errors loudly instead of swallowing them", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
      updateBooking: async () => {
        throw new Error("db connection lost");
      },
    });

    await assert.rejects(
      () =>
        new DriverCheckInService(prisma).batchSync(DRIVER_A, [
          { ticketToken: "tok-abc", scannedAt: SCANNED_AT },
        ]),
      /db connection lost/,
    );
  });
});

// Phase 02 (F-PS-03) — pt. presentation tokens resolve to durable tokens
// through the injected resolver before any lookup.

describe("DriverCheckInService presentation tokens (Phase 02)", () => {
  const SCANNED_AT = new Date("2026-08-23T07:45:00Z");

  it("resolves pt. tokens via the injected resolver and looks up the durable token", async () => {
    const lookedUp: string[] = [];
    const prisma = createMockPrisma({
      findTokenBooking: async (args) => {
        lookedUp.push(
          (args as { where: { ticketToken: string } }).where.ticketToken,
        );
        return makeBooking({ boardedAt: new Date("2026-08-23T08:00:00Z") });
      },
    });

    const result = await new DriverCheckInService(
      prisma,
      async () => "tok-abc",
    ).scanCheckIn(DRIVER_A, { ticketToken: "pt.cGF5bG9hZA.aGVsbG8" });

    assert.equal(result.alreadyBoarded, true);
    assert.deepEqual(lookedUp, ["tok-abc"]);
  });

  it("rejects unresolvable pt. tokens with NOT_FOUND before lookup", async () => {
    let lookupCount = 0;
    const prisma = createMockPrisma({
      findTokenBooking: async () => {
        lookupCount++;
        return makeBooking();
      },
    });

    const err = await assertThrows(
      () =>
        new DriverCheckInService(prisma, async () => null).scanCheckIn(
          DRIVER_A,
          { ticketToken: "pt.expired.signature" },
        ),
      "NOT_FOUND",
    );
    assert.match(err.message, /Invalid ticket QR code/);
    assert.equal(lookupCount, 0);
  });

  it("passes non-pt. tokens straight through without the resolver", async () => {
    let resolverCalls = 0;
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
    });

    await new DriverCheckInService(prisma, async () => {
      resolverCalls++;
      return null;
    }).scanCheckIn(DRIVER_A, { ticketToken: "tok-bare" });

    assert.equal(resolverCalls, 0);
  });

  it("batch sync rejects unresolvable pt. items per-item without aborting the rest", async () => {
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking(),
      updateBooking: async () => ({ boardedAt: new Date() }),
    });

    const result = await new DriverCheckInService(
      prisma,
      async () => null,
    ).batchSync(DRIVER_A, [
      { ticketToken: "pt.dead.signature", scannedAt: SCANNED_AT },
      { ticketToken: "tok-ok", scannedAt: SCANNED_AT },
    ]);

    assert.deepEqual(
      result.results.map((r) => r.outcome),
      ["REJECTED", "SYNCED"],
    );
    assert.equal(result.syncedCount, 1);
  });
});

describe("DriverCheckInService offline boarding concurrency (Phase 2B / DRV-P1-02)", () => {
  const SCAN_EARLY = new Date("2026-08-23T06:15:00Z");
  const SCAN_LATE = new Date("2026-08-23T06:18:00Z");

  it("atomic CAS prevents race condition when two devices sync concurrently", async () => {
    let updateManyCalls = 0;
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking({ boardedAt: null }),
      updateManyBooking: async () => {
        updateManyCalls++;
        // Simulate race condition: first update succeeds, second returns count 0 (already boarded)
        return { count: updateManyCalls === 1 ? 1 : 0 };
      },
    });

    const service = new DriverCheckInService(prisma);

    // Conductor syncs first
    const resConductor = await service.batchSync(DRIVER_A, [
      { ticketToken: "tok-abc", scannedAt: SCAN_EARLY },
    ]);
    assert.equal(resConductor.results[0]?.outcome, "SYNCED");
    assert.equal(resConductor.syncedCount, 1);

    // Driver syncs immediately after (in race window)
    const resDriver = await service.batchSync(DRIVER_B, [
      { ticketToken: "tok-abc", scannedAt: SCAN_LATE },
    ]);
    assert.equal(resDriver.results[0]?.outcome, "ALREADY_BOARDED");
    assert.equal(resDriver.syncedCount, 0);
  });

  it("preserves earliest physical timestamp when an earlier offline scan arrives after a later scan", async () => {
    let backdatedTimestamp: Date | null = null;
    const prisma = createMockPrisma({
      // Booking was already synced with the later timestamp 06:18:00
      findTokenBooking: async () => makeBooking({ boardedAt: SCAN_LATE }),
      updateBooking: async (args: any) => {
        backdatedTimestamp = args.data.boardedAt;
        return { boardedAt: args.data.boardedAt };
      },
    });

    const service = new DriverCheckInService(prisma);

    // Conductor's earlier scan (06:15:00) arrives now
    const result = await service.batchSync(DRIVER_A, [
      { ticketToken: "tok-abc", scannedAt: SCAN_EARLY },
    ]);

    assert.equal(result.results[0]?.outcome, "ALREADY_BOARDED");
    assert.ok(backdatedTimestamp);
    // Verified: boardedAt was updated to the true earlier scan time (06:15:00)
    assert.equal((backdatedTimestamp as Date).getTime(), SCAN_EARLY.getTime());
  });

  it("does not overwrite earlier timestamp when a later scan arrives on an already boarded booking", async () => {
    let updateCalled = false;
    const prisma = createMockPrisma({
      // Booking already has the earlier timestamp 06:15:00
      findTokenBooking: async () => makeBooking({ boardedAt: SCAN_EARLY }),
      updateBooking: async () => {
        updateCalled = true;
        return {};
      },
    });

    const service = new DriverCheckInService(prisma);

    // Later scan (06:18:00) arrives
    const result = await service.batchSync(DRIVER_B, [
      { ticketToken: "tok-abc", scannedAt: SCAN_LATE },
    ]);

    assert.equal(result.results[0]?.outcome, "ALREADY_BOARDED");
    // Verified: No overwrite occurred
    assert.equal(updateCalled, false);
  });

  it("handles duplicate scans of same ticket within single batch payload", async () => {
    let callCount = 0;
    const prisma = createMockPrisma({
      findTokenBooking: async () => makeBooking({ boardedAt: null }),
      updateManyBooking: async () => {
        callCount++;
        // First item in batch updates count 1, second gets count 0
        return { count: callCount === 1 ? 1 : 0 };
      },
    });

    const service = new DriverCheckInService(prisma);

    const result = await service.batchSync(DRIVER_A, [
      { ticketToken: "tok-abc", scannedAt: SCAN_EARLY },
      { ticketToken: "tok-abc", scannedAt: SCAN_LATE },
    ]);

    assert.equal(result.results[0]?.outcome, "SYNCED");
    assert.equal(result.results[1]?.outcome, "ALREADY_BOARDED");
    assert.equal(result.syncedCount, 1);
  });
});
