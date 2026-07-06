import type { PrismaClient } from "@moja/db";
import type { ConfirmedBookingResult } from "@moja/types";
import { sendEmail } from "@/lib/email-client";
import { formatPriceXOF } from "@/features/search/lib/format";

export async function sendBookingReceiptEmail(input: {
  to: string;
  passengerName: string;
  companyName: string;
  originCityName: string;
  destinationCityName: string;
  departureTime: Date;
  bookingReferences: string[];
  subtotalBaseXOF: number;
  convenienceFeeXOF: number;
  totalAmountXOF: number;
}) {
  const refs = input.bookingReferences.join(", ");
  const subject = `Your Moja Ride booking — ${refs}`;
  const text = [
    `Hello ${input.passengerName},`,
    "",
    "Your payment was successful. Here is your booking summary:",
    "",
    `Operator: ${input.companyName}`,
    `Route: ${input.originCityName} → ${input.destinationCityName}`,
    `Departure: ${input.departureTime.toLocaleString("en-CI")}`,
    `Booking reference(s): ${refs}`,
    "",
    `Fare: ${formatPriceXOF(input.subtotalBaseXOF)}`,
    `Service fee: ${formatPriceXOF(input.convenienceFeeXOF)}`,
    `Total paid: ${formatPriceXOF(input.totalAmountXOF)}`,
    "",
    "Prices are tax-inclusive. Present your digital ticket at boarding.",
    "",
    "Thank you for riding with Moja Ride.",
  ].join("\n");

  const html = `
    <p>Hello ${input.passengerName},</p>
    <p>Your payment was successful. Here is your booking summary:</p>
    <ul>
      <li><strong>Operator:</strong> ${input.companyName}</li>
      <li><strong>Route:</strong> ${input.originCityName} → ${input.destinationCityName}</li>
      <li><strong>Departure:</strong> ${input.departureTime.toLocaleString("en-CI")}</li>
      <li><strong>Reference(s):</strong> ${refs}</li>
    </ul>
    <p>
      Fare: ${formatPriceXOF(input.subtotalBaseXOF)}<br/>
      Service fee: ${formatPriceXOF(input.convenienceFeeXOF)}<br/>
      <strong>Total paid: ${formatPriceXOF(input.totalAmountXOF)}</strong>
    </p>
    <p>Prices are tax-inclusive. Present your digital ticket at boarding.</p>
    <p>Thank you for riding with Moja Ride.</p>
  `;

  await sendEmail({ to: input.to, subject, html, text });
}

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
        select: { passengerName: true, bookingReference: true },
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
      : null);

  if (!email) return;

  const route = holdGroup.trip.schedule.route;
  await sendBookingReceiptEmail({
    to: email,
    passengerName: holdGroup.bookings[0]?.passengerName ?? "Traveler",
    companyName: holdGroup.trip.company.name,
    originCityName:
      route.originTerminal.cityRelation?.name ?? "Côte d'Ivoire",
    destinationCityName:
      route.destTerminal.cityRelation?.name ?? "Côte d'Ivoire",
    departureTime: holdGroup.trip.departureDate,
    bookingReferences: confirmed.bookingReferences,
    subtotalBaseXOF: holdGroup.pricingSnapshot.subtotalBaseXOF,
    convenienceFeeXOF: holdGroup.pricingSnapshot.convenienceFeeXOF,
    totalAmountXOF: holdGroup.pricingSnapshot.chargeAmountXOF,
  });
}
