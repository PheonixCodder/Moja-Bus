import { getTranslations } from "next-intl/server";
import { PassengerWalletView } from "@/features/passenger/views/passenger-wallet-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passengerDashboard.wallet" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function WalletPage() {
  const t = await getTranslations("passengerDashboard.wallet");

  await prefetch(trpc.passenger.getWalletBalance.queryOptions());
  await prefetch(
    trpc.passenger.getWalletLedger.queryOptions({
      limit: 20,
      offset: 0,
    })
  );
  await prefetch(trpc.discounts.listMyCreditLots.queryOptions());

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />

        <PassengerWalletView />
      </div>
    </HydrateClient>
  );
}