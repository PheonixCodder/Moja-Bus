"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Star, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@moja/ui/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

export function TripAuditReviews({ tripId }: { tripId: string }) {
  const trpc = useTRPC();
  const { data: trip } = useSuspenseQuery(
    trpc.admin.getTripAudit.queryOptions({ id: tripId })
  );

  const bookingsWithReviews = trip.bookings.filter((b) => b.review != null);

  if (bookingsWithReviews.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-16 text-center shadow-sm">
        <MessageCircle className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No reviews yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Reviews appear here once passengers submit feedback after completing
          their trip.
        </p>
      </div>
    );
  }

  const avgRating =
    bookingsWithReviews.reduce((sum, b) => sum + (b.review?.rating ?? 0), 0) /
    bookingsWithReviews.length;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm flex items-center gap-5">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {avgRating.toFixed(1)}
          </p>
          <StarRating rating={Math.round(avgRating)} />
          <p className="text-xs text-muted-foreground mt-1">
            {bookingsWithReviews.length} review
            {bookingsWithReviews.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="flex flex-col gap-1.5 flex-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = bookingsWithReviews.filter(
              (b) => b.review?.rating === star
            ).length;
            const pct =
              bookingsWithReviews.length > 0
                ? (count / bookingsWithReviews.length) * 100
                : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3">{star}</span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-4">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-3">
        {bookingsWithReviews.map((booking) => {
          const review = booking.review!;
          return (
            <div
              key={booking.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {booking.passengerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {booking.passengerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seat {booking.seat?.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(new Date(review.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              {review.content && (
                <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                  {review.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
