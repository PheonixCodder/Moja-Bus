"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Search } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { PassengerTripCard } from "@/features/booking/components/passenger-trip-card";
import { isHoldActive } from "@/features/booking/lib/hold-countdown";
import { usePaystackCheckout } from "@/features/payments/hooks/use-paystack-checkout";
import type { PassengerBookingSummary } from "@moja/types";

type BookingFilter = "upcoming" | "past" | "pending";

const TABS: { id: BookingFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending payment" },
  { id: "past", label: "Past" },
];

function EmptyState({ filter }: { filter: BookingFilter }) {
  const messages: Record<BookingFilter, string> = {
    upcoming: "No upcoming trips yet. Search for a route and book your next journey.",
    pending: "No bookings awaiting payment.",
    past: "No past bookings to show.",
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
      <CalendarDays className="size-12 mx-auto mb-4 text-slate-300" />
      <p className="text-slate-600 font-medium">{messages[filter]}</p>
      {filter === "upcoming" ? (
        <Link
          href="/"
          className={cn(
            buttonVariants(),
            "mt-6 bg-[#ee237c] hover:bg-[#d01867] text-white font-bold",
          )}
        >
          <Search className="size-4 mr-2" />
          Search trips
        </Link>
      ) : null}
    </div>
  );
}

function ticketHref(booking: PassengerBookingSummary): string | null {
  const ref = booking.seats[0]?.bookingReference;
  if (!ref || booking.status !== "CONFIRMED") return null;
  return `/dashboard/tickets/${encodeURIComponent(ref)}`;
}

function canResumePayment(booking: PassengerBookingSummary): boolean {
  return (
    booking.status === "PENDING_PAYMENT" &&
    Boolean(booking.holdGroupId) &&
    isHoldActive(booking.holdExpiresAt)
  );
}

export function PassengerBookingsView() {
  const trpc = useTRPC();
  const [filter, setFilter] = useState<BookingFilter>("upcoming");
  const [payingGroupId, setPayingGroupId] = useState<string | null>(null);
  const {
    completePayment,
    PaystackPaymentCancelledError,
  } = usePaystackCheckout();

  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.booking.listMyBookings.queryOptions({ filter }),
  );

  async function handleCompletePayment(booking: PassengerBookingSummary) {
    const holdId = booking.holdGroupId;
    if (!holdId) {
      toast.error("This booking cannot be paid here. Please search and book again.");
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
        err instanceof Error ? err.message : "Payment failed. Please try again.";
      toast.error(message);
    } finally {
      setPayingGroupId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-100/80 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              filter === tab.id
                ? "bg-white text-[#ee237c] shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-8 text-[#ee237c]" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Could not load bookings</p>
          <p className="text-sm text-red-600 mt-1">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : !data?.items.length ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {data.total} booking{data.total === 1 ? "" : "s"}
          </p>
          {data.items.map((booking) => {
            const href = ticketHref(booking);
            const isPaying = payingGroupId === booking.groupId;
            const showPayAction = filter === "pending" && canResumePayment(booking);
            const holdExpired =
              filter === "pending" &&
              booking.status === "PENDING_PAYMENT" &&
              !isHoldActive(booking.holdExpiresAt);

            return (
              <PassengerTripCard
                key={booking.groupId}
                booking={booking}
                {...(href
                  ? { action: { label: "View tickets", href } }
                  : {})}
                footer={
                  showPayAction ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPaying}
                      onClick={() => handleCompletePayment(booking)}
                      className="bg-[#ee237c] hover:bg-[#d01867] text-white font-bold"
                    >
                      {isPaying ? (
                        <>
                          <Spinner className="mr-2 size-4" />
                          Processing...
                        </>
                      ) : (
                        "Complete payment"
                      )}
                    </Button>
                  ) : holdExpired ? (
                    <p className="text-xs text-slate-500">
                      This hold has expired.{" "}
                      <Link href="/" className="text-[#ee237c] font-semibold hover:underline">
                        Search trips
                      </Link>{" "}
                      to book again.
                    </p>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
