import type { PrismaClient } from "@moja/db";
import type {
  DriverBatchSyncCheckInsInput,
  DriverCheckInPassengerInput,
  DriverManualCheckInInput,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";

/**
 * Phase 03 (F-IN-01 ≡ F-DV-03) — check-in authorization binding.
 *
 * Every boarding path (scan, manual, offline batch) must pass the same guard
 * pipeline before `boardedAt` is written:
 *
 *   1. Tenancy — the caller holds a TripDriverAssignment on the booking's
 *      trip (any crew role: PRIMARY, RELIEF or CONDUCTOR — mirrors
 *      getMyTripManifest). Unassigned → FORBIDDEN.
 *   2. Intent — if the client declared a tripId, it must match the ticket's
 *      trip → BAD_REQUEST on mismatch.
 *   3. Status — only CONFIRMED bookings board. PENDING_PAYMENT was boardable
 *      via scan before this phase; manual/batch had no status guard at all.
 *   4. Window — trip must not be CANCELLED or ARRIVED. Deliberately NOT the
 *      operator's BOARDING|DELAYED|DEPARTED window: BOARDING is never written
 *      in production and gate boarding happens while the trip is still
 *      SCHEDULED, before Start Run.
 *
 * Failures are explicit (NOT_FOUND / FORBIDDEN / BAD_REQUEST /
 * PRECONDITION_FAILED) rather than collapsed into a generic miss — the token
 * space is an unguessable cuid, so the resulting existence oracle is worth
 * less than diagnosable errors at the gate.
 */

/** Trip statuses during which boarding is possible. */
const BOARDABLE_TRIP_STATUSES = new Set([
  "SCHEDULED",
  "BOARDING",
  "DELAYED",
  "DEPARTED",
]);

/** Structural view of a booking with the relations check-in needs. */
interface CheckInBookingView {
  id: string;
  tripId: string;
  status: string;
  boardedAt: Date | null;
  checkedInAt: Date | null;
  bookingReference: string;
  passengerName: string;
  seat: { label: string | null } | null;
  trip: { id: string; status: string };
}

export type BatchSyncCheckInItem =
  DriverBatchSyncCheckInsInput["checkIns"][number];

export type BatchSyncOutcome = {
  index: number;
  outcome: "SYNCED" | "ALREADY_BOARDED" | "REJECTED";
  reason?: string | undefined;
  passengerName?: string | undefined;
  bookingReference?: string | undefined;
};

function nonConfirmedMessage(status: string): string {
  if (status === "PENDING_PAYMENT") {
    return "Payment for this ticket was not completed — it cannot be boarded.";
  }
  return "This ticket was cancelled or refunded and is not valid for travel.";
}

const bookingInclude = {
  seat: { select: { label: true } },
  trip: { select: { id: true, status: true } },
} as const;

export class DriverCheckInService {
  /**
   * `resolvePresentationToken` (Phase 02) resolves `pt.` presentation tokens
   * to their durable ticket token before lookup. URL/JSON forms never reach
   * this class — the shared schema preprocess normalizes them earlier.
   */
  constructor(
    private prisma: PrismaClient,
    private resolvePresentationToken?: (
      token: string,
    ) => Promise<string | null>,
  ) {}

  /** Reduce any accepted token form to the durable token stored on bookings. */
  private async durableTicketToken(token: string): Promise<string> {
    if (!token.startsWith("pt.")) {
      return token;
    }
    const resolved = await this.resolvePresentationToken?.(token);
    if (!resolved) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid ticket QR code. No booking found.",
      });
    }
    return resolved;
  }

  /**
   * Guard pipeline shared by all three boarding paths. Throws the explicit
   * TRPCError for the first failed guard; returns normally when boardable.
   */
  private async assertBoardable(
    driverProfileId: string,
    booking: CheckInBookingView,
    sentTripId?: string | undefined,
  ): Promise<void> {
    // 1. Tenancy binding — row existence IS the active assignment
    // (unassignDriver deletes rows; there is no isActive flag).
    const assignment = await this.prisma.tripDriverAssignment.findFirst({
      where: { driverProfileId, tripId: booking.tripId },
      select: { id: true },
    });
    if (!assignment) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not assigned to this trip.",
      });
    }

    // 2. Declared intent must match the ticket's own trip identity.
    if (sentTripId && sentTripId !== booking.tripId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This ticket belongs to a different scheduled trip.",
      });
    }

    // 3. Only paid-and-standing bookings can board.
    if (booking.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: nonConfirmedMessage(booking.status),
      });
    }

    // 4. Boarding window — closed once the run is done or cancelled.
    if (!BOARDABLE_TRIP_STATUSES.has(booking.trip.status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Boarding is closed for this trip (current status: ${booking.trip.status}).`,
      });
    }
  }

  /** QR scan path — resolves the booking by durable ticket token. */
  async scanCheckIn(
    driverProfileId: string,
    input: DriverCheckInPassengerInput,
  ) {
    const ticketToken = await this.durableTicketToken(input.ticketToken);
    const booking = await this.prisma.booking.findUnique({
      where: { ticketToken },
      include: bookingInclude,
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid ticket QR code. No booking found.",
      });
    }

    await this.assertBoardable(driverProfileId, booking, input.tripId);

    if (booking.boardedAt) {
      return {
        success: false,
        alreadyBoarded: true,
        boardedAt: booking.boardedAt,
        passengerName: booking.passengerName,
        seatNumber: booking.seat?.label ?? "N/A",
        bookingReference: booking.bookingReference,
        message: "Passenger was already scanned and boarded.",
      };
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        boardedAt: new Date(),
        checkedInAt: booking.checkedInAt ?? new Date(),
      },
    });

    return {
      success: true,
      alreadyBoarded: false,
      boardedAt: updated.boardedAt,
      passengerName: booking.passengerName,
      seatNumber: booking.seat?.label ?? "N/A",
      bookingReference: booking.bookingReference,
      message: "Boarding cleared successfully.",
    };
  }

  /** Manual fallback — passenger known by manifest row (bookingId + tripId). */
  async manualCheckIn(
    driverProfileId: string,
    input: DriverManualCheckInInput,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: input.bookingId,
        tripId: input.tripId,
      },
      include: bookingInclude,
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Passenger booking not found on this trip.",
      });
    }

    await this.assertBoardable(driverProfileId, booking);

    if (booking.boardedAt) {
      return {
        success: true,
        alreadyBoarded: true,
        passengerName: booking.passengerName,
        seatNumber: booking.seat?.label ?? "N/A",
      };
    }

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        boardedAt: new Date(),
        checkedInAt: booking.checkedInAt ?? new Date(),
      },
    });

    return {
      success: true,
      alreadyBoarded: false,
      passengerName: booking.passengerName,
      seatNumber: booking.seat?.label ?? "N/A",
    };
  }

  /**
   * Offline queue flush. Each item is judged independently and REPORTED —
   * rejections are per-item results, never swallowed (the old empty catch)
   * and never abort the remaining items. Unexpected (non-rejection) errors
   * still propagate and fail the whole request loudly.
   */
  async batchSync(
    driverProfileId: string,
    checkIns: readonly BatchSyncCheckInItem[],
  ): Promise<{
    success: true;
    results: BatchSyncOutcome[];
    syncedCount: number;
  }> {
    const results: BatchSyncOutcome[] = [];
    let syncedCount = 0;

    for (const [index, item] of checkIns.entries()) {
      try {
        const outcome = await this.syncOne(driverProfileId, item);
        results.push({ index, ...outcome });
        if (outcome.outcome === "SYNCED") syncedCount++;
      } catch (err) {
        if (err instanceof TRPCError) {
          results.push({
            index,
            outcome: "REJECTED",
            reason: err.message,
          });
          continue;
        }
        throw err;
      }
    }

    return { success: true, results, syncedCount };
  }

  private async syncOne(
    driverProfileId: string,
    item: BatchSyncCheckInItem,
  ): Promise<Omit<BatchSyncOutcome, "index">> {
    const ticketToken = await this.durableTicketToken(item.ticketToken);
    const booking = await this.prisma.booking.findUnique({
      where: { ticketToken },
      include: bookingInclude,
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid ticket token.",
      });
    }

    await this.assertBoardable(driverProfileId, booking, item.tripId);

    if (booking.boardedAt) {
      return {
        outcome: "ALREADY_BOARDED",
        passengerName: booking.passengerName,
        bookingReference: booking.bookingReference,
      };
    }

    // Offline scans keep their original scan time.
    const scannedAt = new Date(item.scannedAt);
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        boardedAt: scannedAt,
        checkedInAt: booking.checkedInAt ?? scannedAt,
      },
    });

    return {
      outcome: "SYNCED",
      passengerName: booking.passengerName,
      bookingReference: booking.bookingReference,
    };
  }
}
