import { getTranslations } from "next-intl/server";
import { PassengerTicketsView } from "@/features/booking/views/passenger-tickets-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "passengerDashboard.tickets",
  });
  return { title: t("metaTitle") };
}

export default async function TicketsPage() {
  const t = await getTranslations("passengerDashboard.tickets");

  await prefetch(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <PassengerTicketsView />
      </div>
    </HydrateClient>
  );
}
