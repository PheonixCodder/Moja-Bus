"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  Search,
  Star,
  MessageSquareCode,
  ChevronRight,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { PassengerTripCard } from "@/features/booking/components/passenger-trip-card";
import { isHoldActive } from "@/features/booking/lib/hold-countdown";
import { usePaystackCheckout } from "@/features/payments/hooks/use-paystack-checkout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Label } from "@moja/ui/components/ui/label";
import type { PassengerBookingSummary } from "@moja/types";

type BookingFilter = "upcoming" | "past" | "pending";

const TABS: { id: BookingFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending payment" },
  { id: "past", label: "Past" },
];

export function PassengerBookingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BookingFilter>("upcoming");
  const [payingGroupId, setPayingGroupId] = useState<string | null>(null);

  // Review Dialog State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<PassengerBookingSummary | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const { completePayment, PaystackPaymentCancelledError } =
    usePaystackCheckout();

  // Fetch bookings based on filter
  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.booking.listMyBookings.queryOptions({ filter }),
  );

  // Fetch user's reviews to cross-reference
  const { data: userReviews } = useQuery(
    trpc.passenger.getUserReviews.queryOptions(),
  );

  // Mutation to submit review
  const submitReviewMutation = useMutation(
    trpc.passenger.submitReview.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted successfully! Thank you.");
        queryClient.invalidateQueries(
          trpc.passenger.getUserReviews.pathFilter(),
        );
        setIsReviewOpen(false);
        setReviewContent("");
        setRating(5);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit review");
      },
    }),
  );

  async function handleCompletePayment(booking: PassengerBookingSummary) {
    const holdId = booking.holdGroupId;
    if (!holdId) {
      toast.error(
        "This booking cannot be paid here. Please search and book again.",
      );
      return;
    }

    setPayingGroupId(booking.groupId);
    try {
      const confirmed = await completePayment({ holdId });
      if (!confirmed) {
        return;
      }

      toast.success("Payment confirmed. Your tickets are ready.");
      await refetch();
    } catch (err: unknown) {
      if (err instanceof PaystackPaymentCancelledError) {
        toast.error("Payment was cancelled");
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.";
      toast.error(message);
    } finally {
      setPayingGroupId(null);
    }
  }

  function handleOpenReview(booking: PassengerBookingSummary) {
    setSelectedBooking(booking);
    setRating(5);
    setReviewContent("");
    setIsReviewOpen(true);
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const firstBookingId = selectedBooking.seats[0]?.bookingId;
    if (!firstBookingId) {
      toast.error("Cannot submit review: missing booking ID.");
      return;
    }

    submitReviewMutation.mutate({
      companyId: selectedBooking.companyId,
      bookingId: firstBookingId,
      rating,
      content: reviewContent.trim() || null,
    });
  };

  const isReviewing = submitReviewMutation.isPending;

  function ticketHref(booking: PassengerBookingSummary): string | null {
    const ref = booking.seats[0]?.bookingReference;
    if (!ref || booking.status !== "CONFIRMED") return null;
    return `/tickets/${encodeURIComponent(ref)}`;
  }

  function canResumePayment(booking: PassengerBookingSummary): boolean {
    return (
      booking.status === "PENDING_PAYMENT" &&
      Boolean(booking.holdGroupId) &&
      isHoldActive(booking.holdExpiresAt)
    );
  }

  // Helper to check if a booking group has already been reviewed
  const isReviewed = (booking: PassengerBookingSummary) => {
    const firstBookingId = booking.seats[0]?.bookingId;
    if (!firstBookingId || !userReviews) return false;
    return userReviews.some((r) => r.bookingId === firstBookingId);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Premium Tab switcher */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-bg-elevated border border-border/80 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
              filter === tab.id
                ? "bg-bg-surface text-primary border border-border/60 shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
          <p className="text-error font-medium">Could not load bookings</p>
          <p className="text-sm text-text-muted mt-1">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button
            variant="outline"
            className="mt-4 border-border text-text-primary"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      ) : !data?.items.length ? (
        // Premium custom empty state matching main theme
        <div className="rounded-2xl border border-dashed border-border bg-bg-surface p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 bg-bg-elevated text-text-muted rounded-full flex items-center justify-center">
            <CalendarDays className="size-6 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
            {filter === "upcoming"
              ? "No upcoming trips yet. Search for a route and book your next journey."
              : filter === "pending"
                ? "No bookings awaiting payment."
                : "No past bookings to show."}
          </p>
          {filter === "upcoming" ? (
            <Link
              href="/"
              className={cn(
                buttonVariants(),
                "mt-4 bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 rounded-lg",
              )}
            >
              <Search className="size-4 mr-2" />
              Book a Ticket
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">
            {data.total} Booking{data.total === 1 ? "" : "s"} Found
          </p>
          {data.items.map((booking) => {
            const href = ticketHref(booking);
            const isPaying = payingGroupId === booking.groupId;
            const showPayAction =
              filter === "pending" && canResumePayment(booking);
            const holdExpired =
              filter === "pending" &&
              booking.status === "PENDING_PAYMENT" &&
              !isHoldActive(booking.holdExpiresAt);
            const alreadyReviewed = isReviewed(booking);

            return (
              <PassengerTripCard
                key={booking.groupId}
                booking={booking}
                className="border border-border/80 bg-bg-surface"
                {...(href ? { action: { label: "View tickets", href } } : {})}
                footer={
                  <div className="flex items-center gap-2 w-full justify-between">
                    {/* Write a Review Button: Only shows on past unreviewed bookings */}
                    {filter === "past" &&
                      (alreadyReviewed ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Reviewed
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReview(booking)}
                          className="border-border text-text-primary hover:bg-bg-elevated h-8 text-xs font-semibold gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          Write a Review
                        </Button>
                      ))}

                    {showPayAction && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPaying}
                        onClick={() => handleCompletePayment(booking)}
                        className="bg-primary hover:bg-primary/95 text-white font-bold h-8 text-xs ml-auto"
                      >
                        {isPaying ? (
                          <>
                            <Spinner className="mr-2 size-3.5 text-white" />
                            Processing...
                          </>
                        ) : (
                          "Complete payment"
                        )}
                      </Button>
                    )}

                    {holdExpired && (
                      <p className="text-[11px] text-text-muted">
                        Hold expired.{" "}
                        <Link
                          href="/"
                          className="text-primary font-bold hover:underline"
                        >
                          Search again
                        </Link>
                      </p>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="border-border bg-bg-surface max-w-md rounded-xl">
          <form onSubmit={handleReviewSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-text-primary">
                Rate your trip with {selectedBooking?.companyName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Your feedback helps us and the operator improve the travel
                experience.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-5">
              {/* Star Rating selection */}
              <div className="flex flex-col items-center justify-center gap-2">
                <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  How was your trip?
                </Label>
                <div className="flex items-center gap-1.5 pt-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled =
                      hoverRating !== null
                        ? star <= hoverRating
                        : star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-text-muted hover:text-amber-500 transition-colors focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-transform duration-100 active:scale-95",
                            filled
                              ? "text-amber-500 fill-amber-500"
                              : "text-text-muted",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Content */}
              <div className="space-y-2">
                <Label
                  htmlFor="review"
                  className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                >
                  Written Feedback (Optional)
                </Label>
                <Textarea
                  id="review"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Share your thoughts about safety, timing, or cleanliness..."
                  className="min-h-[100px] border-border rounded-lg text-sm"
                  maxLength={1000}
                />
                <div className="text-[10px] text-text-muted text-right">
                  {reviewContent.length}/1000 characters
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsReviewOpen(false)}
                className="h-10 text-xs font-semibold text-text-secondary hover:bg-bg-elevated"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isReviewing}
                className="bg-primary text-white hover:bg-primary/95 font-semibold h-10 px-6 rounded-lg gap-2"
              >
                {isReviewing && <Spinner className="w-4 h-4 text-white" />}
                Submit Review
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckCircleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
