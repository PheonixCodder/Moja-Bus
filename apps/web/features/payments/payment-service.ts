import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { PaymentProvider } from "@moja/schemas/payments";
import { getOptionalEnv } from "@moja/config";
import {
  assertHoldGroupActive,
  resolveHoldGroup,
} from "./lib/resolve-hold-group";
import {
  buildPaystackReference,
  isPaystackConfigured,
  paystackInitialize,
  paystackPublicKey,
  paystackVerify,
} from "./providers/paystack-client";
import { BookingConfirmationService } from "./services/booking-confirmation-service";

export type InitiatePaymentResult = {
  holdGroupId: string;
  paymentId: string;
  provider: PaymentProvider;
  status: "PENDING" | "SUCCESS";
  amountXOF: number;
  convenienceFeeXOF: number;
  subtotalBaseXOF: number;
  paystack?: {
    publicKey: string;
    reference: string;
    accessCode: string;
    authorizationUrl: string;
    email: string;
  };
};

export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private confirmationService = new BookingConfirmationService(prisma),
  ) {}

  async initiateForHold(
    holdId: string,
    payerEmail?: string | null,
  ): Promise<InitiatePaymentResult> {
    const holdGroup = await resolveHoldGroup(this.prisma, holdId);
    assertHoldGroupActive(holdGroup);

    const snapshot = holdGroup.pricingSnapshot;
    if (!snapshot) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Pricing snapshot missing for this hold",
      });
    }

    if (!isPaystackConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Paystack is not configured. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.",
      });
    }

    return this.initiatePaystack(holdGroup, snapshot, payerEmail);
  }

  private async initiatePaystack(
    holdGroup: Awaited<ReturnType<typeof resolveHoldGroup>>,
    snapshot: NonNullable<
      Awaited<ReturnType<typeof resolveHoldGroup>>["pricingSnapshot"]
    >,
    payerEmail?: string | null,
  ): Promise<InitiatePaymentResult> {
    const email =
      payerEmail?.trim() ||
      holdGroup.bookings[0]?.passengerPhone.replace(/\s+/g, "") + "@guest.mojaride.ci";

    const company = await this.prisma.company.findUnique({
      where: { id: holdGroup.companyId },
      select: { paystackSubaccountCode: true },
    });

    const payment = await this.prisma.payment.findUnique({
      where: { holdGroupId: holdGroup.id },
      include: { attempts: { orderBy: { attemptNumber: "desc" }, take: 1 } },
    });

    let paymentRecord = payment;
    let attemptNumber = 1;

    if (paymentRecord) {
      if (paymentRecord.status === "SUCCESS") {
        return {
          holdGroupId: holdGroup.id,
          paymentId: paymentRecord.id,
          provider: "PAYSTACK",
          status: "SUCCESS",
          amountXOF: snapshot.chargeAmountXOF,
          convenienceFeeXOF: snapshot.convenienceFeeXOF,
          subtotalBaseXOF: snapshot.subtotalBaseXOF,
        };
      }
      attemptNumber = (paymentRecord.attempts[0]?.attemptNumber ?? 0) + 1;
    } else {
      paymentRecord = await this.prisma.payment.create({
        data: {
          holdGroupId: holdGroup.id,
          provider: "PAYSTACK",
          amountXOF: snapshot.chargeAmountXOF,
          status: "INITIALIZED",
        },
        include: { attempts: true },
      });
    }

    const reference = buildPaystackReference(holdGroup.id, attemptNumber);
    const callbackUrl =
      getOptionalEnv("NEXT_PUBLIC_APP_URL") != null
        ? `${getOptionalEnv("NEXT_PUBLIC_APP_URL")}/api/payments/verify?holdGroupId=${holdGroup.id}`
        : undefined;

    const initialized = await paystackInitialize({
      email,
      amountXOF: snapshot.chargeAmountXOF,
      reference,
      metadata: {
        holdGroupId: holdGroup.id,
        offerId: holdGroup.offerId,
      },
      subaccountCode: company?.paystackSubaccountCode,
      callbackUrl,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.create({
        data: {
          paymentId: paymentRecord!.id,
          attemptNumber,
          paystackReference: reference,
          status: "PENDING",
          metadata: { accessCode: initialized.accessCode },
        },
      });

      await tx.payment.update({
        where: { id: paymentRecord!.id },
        data: {
          status: "PENDING",
          paystackReference: reference,
          metadata: {
            authorizationUrl: initialized.authorizationUrl,
            accessCode: initialized.accessCode,
          },
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: paymentRecord!.id,
          eventType: "INITIALIZED",
          payload: { reference, amountXOF: snapshot.chargeAmountXOF },
        },
      });
    });

    return {
      holdGroupId: holdGroup.id,
      paymentId: paymentRecord.id,
      provider: "PAYSTACK",
      status: "PENDING",
      amountXOF: snapshot.chargeAmountXOF,
      convenienceFeeXOF: snapshot.convenienceFeeXOF,
      subtotalBaseXOF: snapshot.subtotalBaseXOF,
      paystack: {
        publicKey: paystackPublicKey(),
        reference,
        accessCode: initialized.accessCode,
        authorizationUrl: initialized.authorizationUrl,
        email,
      },
    };
  }

  async verifyAndConfirm(
    reference: string,
    userId?: string | null,
  ): Promise<import("@moja/types").ConfirmedBookingResult> {
    const payment = await this.prisma.payment.findFirst({
      where: { paystackReference: reference },
      include: { holdGroup: true },
    });

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment reference not found",
      });
    }

    if (payment.status === "SUCCESS") {
      return this.confirmationService.confirmFromPayment(
        payment.holdGroupId,
        userId,
      );
    }

    const verified = await paystackVerify(reference);

    if (verified.status !== "success") {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: verified.status === "failed" ? "FAILED" : "PENDING" },
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment verification failed or is still pending",
      });
    }

    if (verified.amountXOF !== payment.amountXOF) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment amount mismatch",
      });
    }

    await this.markPaymentSuccess(payment.id, verified);
    return this.confirmationService.confirmFromPayment(
      payment.holdGroupId,
      userId,
    );
  }

  async handleWebhookEvent(payload: {
    event: string;
    data: {
      reference?: string;
      id?: number;
      status?: string;
      amount?: number;
      channel?: string;
      fees?: number;
    };
  }) {
    const reference = payload.data.reference;
    if (!reference) return { handled: false };

    const idempotencyKey = `${payload.event}:${reference}:${payload.data.id ?? ""}`;

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.processedAt) {
      return { handled: true, duplicate: true };
    }

    await this.prisma.webhookEvent.upsert({
      where: { idempotencyKey },
      create: {
        provider: "PAYSTACK",
        eventType: payload.event,
        idempotencyKey,
        reference,
        payload: payload as object,
      },
      update: {},
    });

    if (payload.event !== "charge.success") {
      await this.prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: { processedAt: new Date() },
      });
      return { handled: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { paystackReference: reference },
    });

    if (!payment) {
      await this.prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: {
          processedAt: new Date(),
          error: "Payment not found for reference",
        },
      });
      return { handled: false };
    }

    if (payment.status !== "SUCCESS") {
      const verified = await paystackVerify(reference);
      if (verified.status === "success") {
        await this.markPaymentSuccess(payment.id, verified);
        await this.confirmationService.confirmFromPayment(payment.holdGroupId);
      }
    } else {
      await this.confirmationService.confirmFromPayment(payment.holdGroupId);
    }

    await this.prisma.webhookEvent.update({
      where: { idempotencyKey },
      data: { processedAt: new Date() },
    });

    return { handled: true };
  }

  private async markPaymentSuccess(
    paymentId: string,
    verified: Awaited<ReturnType<typeof paystackVerify>>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          channel: verified.channel,
          feesXOF: verified.feesXOF,
          confirmedAt: verified.paidAt ? new Date(verified.paidAt) : new Date(),
          metadata: { verifyRaw: verified.raw as object },
        },
      });

      await tx.paymentAttempt.updateMany({
        where: { paystackReference: verified.reference },
        data: { status: "SUCCESS", channel: verified.channel },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId,
          eventType: "VERIFIED_SUCCESS",
          payload: {
            reference: verified.reference,
            amountXOF: verified.amountXOF,
            channel: verified.channel,
          },
        },
      });
    });
  }

  async assertHoldPaid(holdId: string) {
    const holdGroup = await resolveHoldGroup(this.prisma, holdId);
    if (!holdGroup.payment || holdGroup.payment.status !== "SUCCESS") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment has not been completed for this hold",
      });
    }
  }

  async getPricingPreview(input: {
    baseFareXOF: number;
    seatCount: number;
    distanceKm: number | null;
  }) {
    const { loadPlatformSettings, resolvePricing } = await import(
      "./lib/pricing-resolver"
    );
    const { settings, tiers } = await loadPlatformSettings(this.prisma);
    return resolvePricing({
      baseFareXOF: input.baseFareXOF,
      seatCount: input.seatCount,
      distanceKm: input.distanceKm,
      settings,
      tiers,
    });
  }
}
