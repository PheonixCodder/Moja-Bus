"use client";

import { useMutation } from "@tanstack/react-query";
import type { ConfirmedBookingResult } from "@moja/types";
import { useLocale } from "next-intl";
import { useTRPC } from "@/trpc/client";
import {
  openPaystackCheckout,
  PaystackPaymentCancelledError,
} from "@/features/payments/lib/paystack-checkout";

export type CompletePaystackPaymentInput = {
  holdId: string;
  payerEmail?: string | null;
};

type ConfirmedBookingWithSuccessUrl = ConfirmedBookingResult & {
  successUrl?: string;
};

export function usePaystackCheckout() {
  const trpc = useTRPC();
  const locale = useLocale();

  const initiatePaymentMutation = useMutation(
    trpc.booking.initiatePayment.mutationOptions(),
  );
  const verifyPaymentMutation = useMutation(
    trpc.booking.verifyPayment.mutationOptions(),
  );
  const confirmMutation = useMutation(
    trpc.booking.confirmBooking.mutationOptions(),
  );

  async function completePayment(
    input: CompletePaystackPaymentInput,
  ): Promise<ConfirmedBookingWithSuccessUrl | null> {
    const payment = await initiatePaymentMutation.mutateAsync({
      holdId: input.holdId,
      payerEmail: input.payerEmail ?? undefined,
      locale: locale === "fr" ? "fr" : "en",
    });

    if (payment.status === "SUCCESS") {
      return confirmMutation.mutateAsync({
        holdId: input.holdId,
        locale: locale === "fr" ? "fr" : "en",
      });
    }

    if (!payment.paystack) {
      throw new Error("Paystack configuration missing");
    }

    const popupResult = await openPaystackCheckout({
      publicKey: payment.paystack.publicKey,
      accessCode: payment.paystack.accessCode,
      reference: payment.paystack.reference,
      authorizationUrl: payment.paystack.authorizationUrl,
    });

    if (!popupResult) {
      return null;
    }

    return verifyPaymentMutation.mutateAsync({
      reference: popupResult.reference,
      locale: locale === "fr" ? "fr" : "en",
    });
  }

  const isPending =
    initiatePaymentMutation.isPending ||
    verifyPaymentMutation.isPending ||
    confirmMutation.isPending;

  return {
    completePayment,
    isPending,
    PaystackPaymentCancelledError,
  };
}
