"use client";

import * as React from "react";
import { BusFront } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import type { PassengerBookingSummary, PassengerBookingStatus } from "@moja/types";
import { formatDepartureTime } from "@/features/search/lib/format";
import { useHoldCountdown } from "@/features/booking/lib/hold-countdown";

const STATUS_PROGRESS: Record<PassengerBookingStatus, number> = {
  CONFIRMED: 100,
  PENDING_PAYMENT: 30,
  COMPLETED: 100,
  CANCELLED: 0,
  EXPIRED: 0,
};

const STATUS_RING_CLASS: Record<PassengerBookingStatus, string> = {
  CONFIRMED: "text-primary",
  PENDING_PAYMENT: "text-amber-500",
  COMPLETED: "text-muted-foreground",
  CANCELLED: "text-destructive",
  EXPIRED: "text-muted-foreground",
};

const STATUS_LABEL: Record<PassengerBookingStatus, string> = {
  CONFIRMED: "Confirmed",
  PENDING_PAYMENT: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

function ProgressRing({
  status,
  progress,
}: {
  status: PassengerBookingStatus;
  progress: number;
}) {
  const angle = (progress / 100) * 360;
  const ringClass = STATUS_RING_CLASS[status];

  return (
    <div
      style={{ "--angle": `${angle}deg` } as React.CSSProperties}
      className={cn(
        "grid size-3 place-items-center rounded-full p-[0.5px]",
        "bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]",
        ringClass,
      )}
    >
      <div className="grid size-2 place-items-center rounded-full bg-card">
        <div className="size-1 rounded-full bg-current" />
      </div>
    </div>
  );
}

function HoldLabel({ booking }: { booking: PassengerBookingSummary }) {
  const countdown = useHoldCountdown(
    booking.status === "PENDING_PAYMENT" ? booking.holdExpiresAt : null,
  );
  if (booking.status !== "PENDING_PAYMENT") return null;
  return (
    <span className="text-amber-600 text-[10px]">
      {countdown?.label ?? "Awaiting payment"}
    </span>
  );
}

type BookingCardProps = {
  booking: PassengerBookingSummary;
  active?: boolean;
  onSelect: (groupId: string) => void;
};

export function BookingCard({ booking, active, onSelect }: BookingCardProps) {
  const progress = STATUS_PROGRESS[booking.status];
  const ref = booking.seats[0]?.bookingReference ?? booking.groupId;
  const shortRef = ref.length > 10 ? ref.slice(0, 10) : ref;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(e) => {
        e.currentTarget.blur();
        onSelect(booking.groupId);
      }}
      className={cn(
        "flex w-full flex-col gap-3.5 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "border-primary bg-muted/50",
      )}
    >
      {/* Row 1 — ref + status */}
      <div className="flex items-center justify-between">
        <div className="font-medium text-xs tabular-nums tracking-tight">
          #{shortRef}
        </div>
        <div className="flex items-center gap-1.5">
          <ProgressRing status={booking.status} progress={progress} />
          <div className="text-muted-foreground text-xs">
            {STATUS_LABEL[booking.status]}
          </div>
        </div>
      </div>

      {/* Row 2 — origin ↔ destination */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="font-medium text-xs leading-none">
            {booking.originCityName}
          </div>
          <div className="text-muted-foreground text-[10px]">
            {booking.originTerminalName}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <div className="font-medium text-xs leading-none">
            {booking.destinationCityName}
          </div>
          <div className="text-muted-foreground text-[10px]">
            {booking.destinationTerminalName}
          </div>
        </div>
      </div>

      {/* Row 3 — dashed progress line with bus icon */}
      <div className="flex items-center gap-0.5">
        <span
          className="h-px min-w-0 border-foreground border-t border-dashed"
          style={{ flexGrow: progress, flexBasis: 0 }}
        />
        <BusFront className="size-3.5 shrink-0" />
        <span
          className="h-px min-w-0 border-border border-t border-dashed"
          style={{ flexGrow: 100 - progress, flexBasis: 0 }}
        />
      </div>

      {/* Row 4 — times + hold info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-[10px] leading-none">
            Departs
          </div>
          <div className="text-sm tabular-nums tracking-tight">
            {formatDepartureTime(booking.departureTime)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground text-[10px] leading-none">
            Arrives
          </div>
          <div className="text-sm tabular-nums tracking-tight">
            {formatDepartureTime(booking.arrivalTime)}
          </div>
        </div>
      </div>

      {/* Hold countdown (pending only) */}
      {booking.status === "PENDING_PAYMENT" && (
        <HoldLabel booking={booking} />
      )}
    </button>
  );
}
