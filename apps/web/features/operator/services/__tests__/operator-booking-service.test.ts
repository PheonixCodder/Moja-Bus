import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRPCError } from "@trpc/server";
import { OperatorBookingService } from "@/features/operator/services/operator-booking-service";

const COMPANY_A = "company-a";
const COMPANY_B = "company-b";
const TRIP_A = "trip-a";
const TRIP_B = "trip-b";

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    companyId: COMPANY_A,
    tripId: TRIP_A,
    status: "CONFIRMED",
    bookingReference: "MR-TEST01",
    passengerName: "Jane Doe",
    passengerPhone: "+2250700000000",
    checkedInAt: null as Date | null,
    ticketToken: "token-abc",
    seat: { label: "A1" },
    trip: { id: TRIP_A, status: "BOARDING" },
    ...overrides,
  };
}

function createMockPrisma(handlers: {
  findFirst?: (args: unknown) => Promise<unknown>;
  findUnique?: (args: unknown) => Promise<unknown>;
  update?: (args: unknown) => Promise<unknown>;
  updateMany?: (args: unknown) => Promise<{ count: number }>;
}) {
  return {
    booking: {
      findFirst: handlers.findFirst ?? (async () => null),
      findUnique: handlers.findUnique ?? (async () => null),
      update: handlers.update ?? (async () => null),
      updateMany: handlers.updateMany ?? (async () => ({ count: 1 })),
      findMany: async () => [],
    },
  } as unknown as ConstructorParameters<typeof OperatorBookingService>[0];
}

describe("OperatorBookingService.checkIn", () => {
  it("checks in a confirmed booking for the correct company", async () => {
    const booking = makeBooking();
    let updated = false;

    const prisma = createMockPrisma({
      findFirst: async () => booking,
      updateMany: async () => {
        updated = true;
        return { count: 1 };
      },
    });

    const service = new OperatorBookingService(prisma);
    const result = await service.checkIn(COMPANY_A, { bookingId: booking.id });

    assert.equal(result.success, true);
    assert.equal(result.alreadyCheckedIn, false);
    assert.equal(result.bookingReference, "MR-TEST01");
    assert.equal(result.seatLabel, "A1");
    assert.ok(updated);
  });

  it("returns idempotent result when already checked in", async () => {
    const checkedAt = new Date("2026-07-03T10:00:00Z");
    const booking = makeBooking({ checkedInAt: checkedAt });

    const prisma = createMockPrisma({
      findFirst: async () => booking,
    });

    const service = new OperatorBookingService(prisma);
    const result = await service.checkIn(COMPANY_A, { bookingId: booking.id });

    assert.equal(result.alreadyCheckedIn, true);
    assert.equal(result.checkedInAt, checkedAt);
  });

  it("rejects check-in for another company", async () => {
    // Company-scoped lookup returns null for foreign tickets
    const prisma = createMockPrisma({
      findFirst: async () => null,
    });

    const service = new OperatorBookingService(prisma);

    await assert.rejects(
      () => service.checkIn(COMPANY_A, { bookingId: "foreign-booking" }),
      (err: unknown) => {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      },
    );
  });

  it("rejects check-in when trip is not boarding", async () => {
    const booking = makeBooking({
      trip: { id: TRIP_A, status: "SCHEDULED" },
    });
    const prisma = createMockPrisma({
      findFirst: async () => booking,
    });

    const service = new OperatorBookingService(prisma);

    await assert.rejects(
      () => service.checkIn(COMPANY_A, { bookingId: booking.id }),
      (err: unknown) => {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "BAD_REQUEST");
        assert.match(err.message, /boarding/i);
        return true;
      },
    );
  });

  it("rejects check-in when tripId does not match", async () => {
    const booking = makeBooking({ tripId: TRIP_B });
    const prisma = createMockPrisma({
      findFirst: async () => booking,
    });

    const service = new OperatorBookingService(prisma);

    await assert.rejects(
      () =>
        service.checkIn(COMPANY_A, {
          bookingId: booking.id,
          tripId: TRIP_A,
        }),
      (err: unknown) => {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "BAD_REQUEST");
        return true;
      },
    );
  });

  it("resolves booking by ticket token from QR URL", async () => {
    const booking = makeBooking();
    const calls: unknown[] = [];

    const prisma = createMockPrisma({
      findFirst: async (args) => {
        calls.push(args);
        if (calls.length === 1) {
          return { id: booking.id };
        }
        return booking;
      },
      updateMany: async () => ({ count: 1 }),
    });

    const service = new OperatorBookingService(prisma);
    const result = await service.checkIn(COMPANY_A, {
      ticketToken: `https://moja.ci/ticket/${booking.ticketToken}`,
    });

    assert.equal(result.success, true);
    assert.equal(result.alreadyCheckedIn, false);
  });

  it("rejects non-confirmed bookings", async () => {
    const booking = makeBooking({ status: "PENDING_PAYMENT" });
    const prisma = createMockPrisma({
      findFirst: async () => booking,
    });

    const service = new OperatorBookingService(prisma);

    await assert.rejects(
      () => service.checkIn(COMPANY_A, { bookingId: booking.id }),
      (err: unknown) => {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "BAD_REQUEST");
        return true;
      },
    );
  });
});
