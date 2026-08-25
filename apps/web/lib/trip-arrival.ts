import type { PrismaClient } from "@moja/db";
import { getNovuClient } from "@/lib/novu";

/**
 * Shared arrival finalization used by BOTH operator `trips.updateStatus(ARRIVED)`
 * and driver `drivers.completeTrip` so neither surface drifts from the other.
 *
 * 1. Stamps booking.completedAt on confirmed bookings (review + escrow eligibility).
 * 2. Fans out one `passenger-review-request` Novu workflow per confirmed booking
 *    (subscriber keyed by user.id; guests fall back to their synthetic email key —
 *    they have no account-side inbox but email/SMS channels still deliver).
 */
export async function finalizeTripArrival(
  db: PrismaClient | any,
  tripId: string,
): Promise<void> {
  await db.booking.updateMany({
    where: {
      tripId,
      status: "CONFIRMED",
      completedAt: null,
    },
    data: { completedAt: new Date() },
  });

  const bookings = await db.booking.findMany({
    where: {
      tripId,
      status: "CONFIRMED",
    },
    include: {
      user: {
        select: { id: true, email: true, fullName: true, phoneNumber: true },
      },
      company: { select: { name: true } },
      trip: {
        include: {
          bus: true,
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                  destTerminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (bookings.length === 0) return;

  const novu = getNovuClient();
  if (!novu) return;

  try {
    for (const booking of bookings) {
      const email =
        booking.user?.email ??
        (booking.passengerPhone
          ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
          : null);
      if (!email) continue;

      const originCity =
        booking.trip.schedule?.route.originTerminal.cityRelation?.name ??
        "Unknown";
      const destCity =
        booking.trip.schedule?.route.destTerminal.cityRelation?.name ??
        "Unknown";
      const originMunicipality =
        booking.trip.schedule?.route.originTerminal.municipality?.name ?? null;
      const destinationMunicipality =
        booking.trip.schedule?.route.destTerminal.municipality?.name ?? null;

      await novu
        .trigger({
          workflowId: "passenger-review-request",
          to: {
            subscriberId: booking.user?.id ?? email,
            email,
          },
          payload: {
            email,
            passengerName: booking.user?.fullName ?? booking.passengerName,
            companyName: booking.company.name,
            originCity,
            destinationCity: destCity,
            originMunicipality,
            destinationMunicipality,
            tripId: booking.trip.id,
            bookingReference: booking.bookingReference,
          },
          transactionId: `passenger-review-request-${booking.trip.id}-${booking.id}`,
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error("Failed to trigger passenger-review-request workflows:", err);
  }
}
