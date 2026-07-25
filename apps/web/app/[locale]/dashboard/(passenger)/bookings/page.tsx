import { getTranslations } from "next-intl/server";
import { PassengerBookingsView } from "@/features/booking/views/passenger-bookings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passengerDashboard.bookings" });
  return { title: t("metaTitle") };
}

export default async function BookingsPage() {
  await Promise.all([
    prefetch(trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" })),
    prefetch(trpc.passenger.getDashboardStats.queryOptions()),
    prefetch(trpc.passenger.getUserReviews.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col h-[calc(100vh-theme(spacing.12))] overflow-hidden">
        <PassengerBookingsView />
      </div>
    </HydrateClient>
  );
}