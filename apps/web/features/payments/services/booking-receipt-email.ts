import type { PrismaClient } from "@moja/db";
import type { ConfirmedBookingResult } from "@moja/types";

export async function sendBookingConfirmedEmails(
  prisma: PrismaClient,
  confirmed: ConfirmedBookingResult,
  userId?: string | null,
  payerEmail?: string | null,
) {
  const holdGroup = await prisma.holdGroup.findUnique({
    where: { id: confirmed.holdId },
    include: {
      bookings: {
        select: { passengerName: true, bookingReference: true, passengerPhone: true },
      },
      pricingSnapshot: true,
      trip: {
        select: {
          departureDate: true,
          company: { select: { name: true } },
          schedule: {
            select: {
              route: {
                select: {
                  originTerminal: {
                    select: { cityRelation: { select: { name: true } } },
                  },
                  destTerminal: {
                    select: { cityRelation: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!holdGroup?.pricingSnapshot) return;

  const email =
    payerEmail ??
    (userId
      ? (await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        }))?.email
      : null) ??
    // Fall back to guest phone-derived email for SMS/phone-only bookings
    (holdGroup.bookings[0]?.passengerPhone
      ? `${holdGroup.bookings[0].passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
      : null);

  if (!email) return;

  const route = holdGroup.trip.schedule.route;
  const originCityName = route.originTerminal.cityRelation?.name ?? "Côte d'Ivoire";
  const destinationCityName = route.destTerminal.cityRelation?.name ?? "Côte d'Ivoire";
  const passengerName = holdGroup.bookings[0]?.passengerName ?? "Traveler";
  const companyName = holdGroup.trip.company.name;
  const departureTime = holdGroup.trip.departureDate;
  // Use confirmed.totalAmountXOF (actual amount paid) rather than the snapshot charge
  // to correctly reflect any post-snapshot adjustments like convenience fee waivers.
  const totalAmountXOF = confirmed.totalAmountXOF ?? holdGroup.pricingSnapshot.chargeAmountXOF;
  const passengerPhone = holdGroup.bookings[0]?.passengerPhone?.replace(/\s+/g, "");

  const novuSecret = process.env["NOVU_SECRET_KEY"];
  
  if (!novuSecret) {
    console.warn("[NOVU] NOVU_SECRET_KEY not configured — passenger booking receipt not sent.");
    return;
  }

  try {
    const { Novu } = await import("@novu/api");
    const novu = new Novu({ secretKey: novuSecret });
    await novu.trigger({
      workflowId: "passenger-booking-confirmed",
      to: {
        subscriberId: email,
        email: email,
      },
      payload: {
        email,
        passengerName,
        companyName,
        originCityName,
        destinationCityName,
        departureTime: departureTime.toLocaleString("en-CI"),
        bookingReferences: confirmed.bookingReferences,
        totalAmountXOF,
        ...(passengerPhone ? { phone: passengerPhone } : {}),
      },
    });
  } catch (error) {
    console.error("[NOVU] Failed to trigger passenger-booking-confirmed via Novu:", error);
  }
}
