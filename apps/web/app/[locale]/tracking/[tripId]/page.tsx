import { getTranslations } from "next-intl/server";
import { PassengerTrackingView } from "@/features/tracking/components/passenger-tracking-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type PageProps = {
  params: Promise<{ locale: string; tripId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "passengerDashboard.tracking",
  });
  return { title: t("metaTitle") };
}

export default async function TrackingPage({ params }: PageProps) {
  const { tripId } = await params;

  // Server-side prefetch — silently fails if unauthorized (client re-fetches)
  try {
    await prefetch(trpc.passenger.getTripTracking.queryOptions({ tripId }));
  } catch {
    // Authorization failure or network error — client will handle
  }

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col h-[calc(100vh-theme(spacing.12))] overflow-hidden">
        <PassengerTrackingView tripId={tripId} backHref="/dashboard/bookings" />
      </div>
    </HydrateClient>
  );
}
