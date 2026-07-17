import Link from "next/link";
import { BusFront, Plus } from "lucide-react";

export function SessionsPanel() {
  const trips: never[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Upcoming trips
        </h2>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-1.5 text-sm text-text-secondary transition-colors duration-150 hover:border-border-strong hover:text-text-primary"
        >
          View all
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-surface py-16 text-center">
          <BusFront className="mb-3 size-10 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">
            No trips booked yet
          </p>
          <p className="mb-4 mt-1 text-xs text-text-muted">
            Search routes and reserve your first seat to get started.
          </p>
          <Link
            href="/dashboard/search"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(238,35,124,0.25),0_0_2px_rgba(238,35,124,1)] transition-colors duration-150 hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Search trips
          </Link>
        </div>
      ) : null}
    </div>
  );
}
