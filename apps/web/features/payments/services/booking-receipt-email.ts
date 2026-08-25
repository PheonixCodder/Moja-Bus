import { type Prisma, type PrismaClient } from "@moja/db";
import type { ConfirmedBookingResult } from "@moja/types";
import { enqueueBookingConfirmed } from "@/features/notifications/outbox/commercial";

/**
 * Build booking-confirmed outbox row (durable Novu delivery via process-outbox cron).
 * Prefer calling from the same transaction as confirm when a tx client is available.
 */
export async function sendBookingConfirmedEmails(
  // Phase 32 (F-PS-14) — accepts a transaction client so the outbox row can
  // enqueue atomically with the confirmation commit.
  prisma: PrismaClient | Prisma.TransactionClient,
  confirmed: ConfirmedBookingResult,
  userId?: string | null,
  payerEmail?: string | null,
) {
  const holdGroup = await prisma.holdGroup.findUnique({
    where: { id: confirmed.holdId },
    include: {
      bookings: {
        select: {
          passengerName: true,
          bookingReference: true,
          passengerPhone: true,
          originTripStop: {
            select: { terminal: { select: { cityRelation: { select: { name: true } } } } },
          },
          destinationTripStop: {
            select: { terminal: { select: { cityRelation: { select: { name: true } } } } },
          },
        },
      },
      pricingSnapshot: true,
      trip: {
        select: {
          departureDate: true,
          company: { select: { name: true } },
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
      : null);

  // P2-18: do not invent @guest.mojaride.ci — undeliverable for Novu/email.
  if (!email) return;

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      })
    : null;

  const booking = holdGroup.bookings[0];
  const originCityName =
    booking?.originTripStop?.terminal?.cityRelation?.name ?? "Côte d'Ivoire";
  const destinationCityName =
    booking?.destinationTripStop?.terminal?.cityRelation?.name ?? "Côte d'Ivoire";
  const passengerName = holdGroup.bookings[0]?.passengerName ?? "Traveler";
  const companyName = holdGroup.trip.company.name;
  const departureTime = holdGroup.trip.departureDate;
  const totalAmountXOF =
    confirmed.totalAmountXOF ?? holdGroup.pricingSnapshot.chargeAmountXOF;
  const passengerPhone = holdGroup.bookings[0]?.passengerPhone?.replace(/\s+/g, "");
  const snapshot = holdGroup.pricingSnapshot;
  const ticketDiscountXOF = snapshot.ticketDiscountXOF ?? 0;
  const creditAppliedXOF = snapshot.creditAppliedXOF ?? 0;
  const feeDiscountXOF = snapshot.feeDiscountXOF ?? 0;
  const preDiscountSubtotalXOF =
    snapshot.preDiscountSubtotalXOF ?? snapshot.subtotalBaseXOF;
  const convenienceFeeXOF = snapshot.convenienceFeeXOF ?? 0;
  const firstName =
    user?.fullName?.split(" ")[0] ?? passengerName.split(" ")[0] ?? "Traveler";

  await enqueueBookingConfirmed(prisma, {
    holdGroupId: confirmed.holdId,
    email,
    subscriberId: userId ?? email,
    firstName,
    data: {
      email,
      passengerName,
      companyName,
      originCityName,
      destinationCityName,
      departureTime: departureTime.toLocaleString("en-CI"),
      bookingReferences: confirmed.bookingReferences,
      totalAmountXOF,
      preDiscountSubtotalXOF,
      ticketDiscountXOF,
      feeDiscountXOF,
      creditAppliedXOF,
      convenienceFeeXOF,
      hasDiscount:
        ticketDiscountXOF > 0 || creditAppliedXOF > 0 || feeDiscountXOF > 0,
      ...(passengerPhone ? { phone: passengerPhone } : {}),
    },
  });
}
