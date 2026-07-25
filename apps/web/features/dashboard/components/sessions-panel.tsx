import Link from "next/link";
import { BusFront, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function SessionsPanel() {
  const t = await getTranslations("passengerDashboard.sessions");
  const trips: never[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("title")}
        </h2>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-1.5 text-sm text-text-secondary transition-colors duration-150 hover:border-border-strong hover:text-text-primary"
        >
          {t("viewAll")}
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-surface py-16 text-center">
          <BusFront className="mb-3 size-10 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">
            {t("noTripsYet")}
          </p>
          <p className="mb-4 mt-1 text-xs text-text-muted">
            {t("noTripsDesc")}
          </p>
          <Link
            href="/dashboard/search"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(238,35,124,0.25),0_0_2px_rgba(238,35,124,1)] transition-colors duration-150 hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("searchTrips")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
