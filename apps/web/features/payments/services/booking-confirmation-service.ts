import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { ConfirmedBookingResult } from "@moja/types";
import {
  assertHoldGroupActive,
  resolveHoldGroup,
} from "../lib/resolve-hold-group";
import { OperatorLedgerService } from "./operator-ledger-service";

export class BookingConfirmationService {
  constructor(
    private prisma: PrismaClient,
    private ledgerService = new OperatorLedgerService(prisma),
  ) {}

  /** Idempotent: safe to call from webhook and verify endpoint. */
  async confirmFromPayment(
    holdGroupId: string,
    userId?: string | null,
  ): Promise<ConfirmedBookingResult> {
    const holdGroup = await resolveHoldGroup(this.prisma, holdGroupId);

    if (holdGroup.status === "CONFIRMED") {
      return {
        holdId: holdGroup.id,
        bookingReferences: holdGroup.bookings.map((b) => b.bookingReference),
        ticketTokens: holdGroup.bookings.map((b) => b.ticketToken),
        totalAmountXOF:
          holdGroup.pricingSnapshot?.chargeAmountXOF ??
          holdGroup.bookings.reduce((sum, b) => sum + b.farePaid, 0),
        status: "CONFIRMED",
      };
    }

    if (!holdGroup.payment || holdGroup.payment.status !== "SUCCESS") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment has not been completed for this hold",
      });
    }

    assertHoldGroupActive(holdGroup);

    const confirmed = await this.prisma.$transaction(async (tx) => {
      const updatedBookings = [];
      for (const booking of holdGroup.bookings) {
        updatedBookings.push(
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              issuedAt: new Date(),
              holdExpiresAt: null,
              ...(userId ? { userId } : {}),
            },
          }),
        );
      }

      await tx.holdGroup.update({
        where: { id: holdGroup.id },
        data: { status: "CONFIRMED" },
      });

      const snapshot = holdGroup.pricingSnapshot;
      if (snapshot && snapshot.operatorNetXOF > 0) {
        const existingLedger = await tx.operatorLedgerEntry.findFirst({
          where: {
            holdGroupId: holdGroup.id,
            sourceType: "PAYMENT",
          },
        });

        if (!existingLedger) {
          await tx.operatorLedgerEntry.create({
            data: {
              companyId: holdGroup.companyId,
              holdGroupId: holdGroup.id,
              paymentId: holdGroup.payment!.id,
              entryType: "CREDIT",
              sourceType: "PAYMENT",
              amountXOF: snapshot.operatorNetXOF,
              description: "Operator share from confirmed booking payment",
            },
          });
        }
      }

      return updatedBookings;
    });

    const totalAmountXOF =
      holdGroup.pricingSnapshot?.chargeAmountXOF ??
      confirmed.reduce((sum, b) => sum + b.farePaid, 0);

    return {
      holdId: holdGroup.id,
      bookingReferences: confirmed.map((b) => b.bookingReference),
      ticketTokens: confirmed.map((b) => b.ticketToken),
      totalAmountXOF,
      status: "CONFIRMED",
    };
  }
}
