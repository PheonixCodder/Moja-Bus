"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
} from "@moja/ui/components/ui/sheet";
import { useTRPC } from "@/trpc/client";
import { usePaystackCheckout } from "@/features/payments/hooks/use-paystack-checkout";
import { isHoldActive } from "@/features/booking/lib/hold-countdown";
import type { PassengerBookingSummary } from "@moja/types";
import { BookingList } from "@/features/booking/components/booking-list";
import { BookingDetails } from "@/features/booking/components/booking-details";

type BookingFilter = "upcoming" | "pending" | "past";

export function PassengerBookingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // ── State ───────────────────────────────────────────
  const [filter, setFilter] = React.useState<BookingFilter>("upcoming");
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<"PAYSTACK" | "WALLET">("PAYSTACK");
  const [isPaying, setIsPaying] = React.useState(false);

  // Review state
  const [reviewBooking, setReviewBooking] = React.useState<PassengerBookingSummary | null>(null);
  const [rating, setRating] = React.useState(5);
  const [reviewContent, setReviewContent] = React.useState("");

  const { completePayment, PaystackPaymentCancelledError } = usePaystackCheckout();

  // ── Queries ──────────────────────────────────────────
  const { data, refetch } = useSuspenseQuery(
    trpc.booking.listMyBookings.queryOptions({ filter }),
  );

  const { data: statsData } = useSuspenseQuery(
    trpc.passenger.getDashboardStats.queryOptions(),
  );

  const { data: userReviews } = useSuspenseQuery(
    trpc.passenger.getUserReviews.queryOptions(),
  );

  // ── Selected booking ────────────────────────────────
  const selectedBooking = React.useMemo(() => {
    if (!data?.items.length) return null;
    if (selectedGroupId) {
      const found = data.items.find((b) => b.groupId === selectedGroupId);
      if (found) return found;
    }
    return data.items[0] ?? null;
  }, [data, selectedGroupId]);

  // Auto-select first item when filter changes
  React.useEffect(() => {
    setSelectedGroupId(null);
  }, [filter]);

  // ── Handlers ─────────────────────────────────────────
  function handleSelectBooking(groupId: string) {
    setSelectedGroupId(groupId);
    setPaymentMethod("PAYSTACK");
    if (window.innerWidth < 1024) {
      setDetailsOpen(true);
    }
  }

  function handleFilterChange(newFilter: BookingFilter) {
    setFilter(newFilter);
  }

  // ── Payment ──────────────────────────────────────────
  const walletCheckoutMutation = useMutation(
    trpc.booking.checkoutWithWallet.mutationOptions(),
  );

  async function executePayment() {
    if (!selectedBooking?.holdGroupId) return;
    const holdId = selectedBooking.holdGroupId;

    if (!isHoldActive(selectedBooking.holdExpiresAt)) {
      toast.error("Hold has expired. Please search and book again.");
      return;
    }

    setIsPaying(true);
    try {
      if (paymentMethod === "PAYSTACK") {
        const confirmed = await completePayment({ holdId });
        if (!confirmed) return;
        toast.success("Payment confirmed. Your tickets are ready.");
        await refetch();
      } else {
        await walletCheckoutMutation.mutateAsync({ holdId });
        toast.success("Payment confirmed using wallet balance. Your tickets are ready.");
        await refetch();
      }
    } catch (err: unknown) {
      if (err instanceof PaystackPaymentCancelledError) {
        toast.error("Payment was cancelled.");
        return;
      }
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  }

  // ── Review ────────────────────────────────────────────
  const submitReviewMutation = useMutation(
    trpc.passenger.submitReview.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted. Thank you!");
        queryClient.invalidateQueries(trpc.passenger.getUserReviews.pathFilter());
        setReviewBooking(null);
        setReviewContent("");
        setRating(5);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit review.");
      },
    }),
  );

  function handleOpenReview(booking: PassengerBookingSummary) {
    const firstBookingId = booking.seats[0]?.bookingId;
    if (!firstBookingId) {
      toast.error("Cannot submit review: missing booking ID.");
      return;
    }
    submitReviewMutation.mutate({
      companyId: booking.companyId,
      bookingId: firstBookingId,
      rating,
      content: reviewContent.trim() || null,
    });
  }

  function isReviewedFn(booking: PassengerBookingSummary): boolean {
    const firstBookingId = booking.seats[0]?.bookingId;
    if (!firstBookingId || !userReviews) return false;
    return userReviews.some((r) => r.bookingId === firstBookingId);
  }

  // ── Render ────────────────────────────────────────────
  const detailsProps = {
    isPaying,
    paymentMethod,
    setPaymentMethod,
    onExecutePayment: executePayment,
    onOpenReview: handleOpenReview,
    isReviewedFn,
  } as const;

  return (
    <>
      {/* Desktop: 2-panel split */}
      <div className="grid h-[calc(100dvh-var(--dashboard-header-height,48px))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x">
        {/* Left panel */}
        <div className="h-full overflow-hidden">
          <BookingList
            bookings={data?.items ?? []}
            total={data?.total ?? 0}
            isLoading={false}
            filter={filter}
            selectedGroupId={selectedGroupId ?? selectedBooking?.groupId ?? null}
            onFilterChange={handleFilterChange}
            onSelectBooking={handleSelectBooking}
            upcomingCount={statsData?.upcomingTripsCount}
            pendingCount={statsData?.pendingPaymentsCount}
          />
        </div>

        {/* Right panel — hidden on mobile, visible on lg+ */}
        <div className="hidden h-full overflow-hidden lg:block">
          <BookingDetails booking={selectedBooking} {...detailsProps} />
        </div>
      </div>

      {/* Mobile: Sheet slide-in */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md [&>button]:hidden"
        >
          <div className="h-full overflow-hidden">
            <BookingDetails booking={selectedBooking} {...detailsProps} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
