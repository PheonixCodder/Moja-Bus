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
      : null);

  if (!email) return;

  const route = holdGroup.trip.schedule.route;
  const originCityName = route.originTerminal.cityRelation?.name ?? "Côte d'Ivoire";
  const destinationCityName = route.destTerminal.cityRelation?.name ?? "Côte d'Ivoire";
  const passengerName = holdGroup.bookings[0]?.passengerName ?? "Traveler";
  const companyName = holdGroup.trip.company.name;
  const departureTime = holdGroup.trip.departureDate;
  const totalAmountXOF = holdGroup.pricingSnapshot.chargeAmountXOF;
  const passengerPhone = holdGroup.bookings[0]?.passengerPhone?.replace(/\s+/g, "");

  const novuSecret = process.env["NOVU_SECRET_KEY"];
  if (novuSecret) {
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
      return;
    } catch (error) {
      console.error("Failed to trigger passenger-booking-confirmed via Novu, falling back:", error);
    }
  }

  // Fallback to legacy direct email dispatch if Novu is not configured or fails
  await sendBookingReceiptEmail({
    to: email,
    passengerName,
    companyName,
    originCityName,
    destinationCityName,
    departureTime,
    bookingReferences: confirmed.bookingReferences,
    subtotalBaseXOF: holdGroup.pricingSnapshot.subtotalBaseXOF,
    convenienceFeeXOF: holdGroup.pricingSnapshot.convenienceFeeXOF,
    totalAmountXOF,
  });
}
